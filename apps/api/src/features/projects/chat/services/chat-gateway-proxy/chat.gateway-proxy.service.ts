import { Injectable, Logger } from '@nestjs/common';
import WebSocket, { type RawData } from 'ws';

import { extractAgentSlugFromSessionKey } from '../../../usage/lib/parse-model-ref';
import { parseWsFrame } from '../../../usage/lib/parse-ws-frame';
import { ModelUsageRecorderService } from '../../../usage/services/model-usage-recorder/model-usage-recorder.service';
import { WorkspaceService } from '../../../workspace/services/workspace/workspace.service';
import { ChatAttachmentsService } from '../chat-attachments/chat-attachments.service';
import {
  isAllowedChatRpc,
  openGatewayUpstream,
} from '@claw-dashboard/control-plane-core';

import type { PendingChatRun } from '../../../usage/lib/usage-record.types';

type ClientSocket = WebSocket;
type UpstreamSocket = WebSocket;
type WsRaw = RawData;

function sendJson(socket: WebSocket, frame: unknown): void {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(frame));
  }
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is string => typeof v === 'string' && v.trim().length > 0,
  );
}

@Injectable()
export class ChatGatewayProxyService {
  private readonly log = new Logger(ChatGatewayProxyService.name);

  constructor(
    private readonly workspace: WorkspaceService,
    private readonly attachments: ChatAttachmentsService,
    private readonly usageRecorder: ModelUsageRecorderService,
  ) {}

  async bridge(params: {
    client: ClientSocket;
    projectId: string;
    userId: string;
    gatewayWsUrl: string;
    gatewayToken: string;
  }): Promise<void> {
    const { client, projectId, userId, gatewayWsUrl, gatewayToken } = params;
    let upstream: UpstreamSocket;
    const projectDataDir = await this.workspace.ensureProjectLayout(projectId);

    try {
      upstream = await openGatewayUpstream(
        gatewayWsUrl,
        gatewayToken,
        projectDataDir,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'GATEWAY_UNREACHABLE';
      this.log.warn(`Upstream connect failed (${gatewayWsUrl}): ${message}`);
      sendJson(client, {
        type: 'event',
        event: 'proxy.error',
        payload: { code: 'GATEWAY_UNREACHABLE', message },
      });
      client.close(1011, 'gateway unreachable');
      return;
    }

    sendJson(client, {
      type: 'event',
      event: 'proxy.ready',
      payload: { ok: true },
    });

    const pendingRuns = new Map<string, PendingChatRun>();

    const closeBoth = (code: number, reason: string) => {
      try {
        if (client.readyState === client.OPEN) client.close(code, reason);
      } catch {
        /* ignore */
      }
      try {
        if (upstream.readyState === upstream.OPEN) upstream.close(code, reason);
      } catch {
        /* ignore */
      }
    };

    upstream.on('message', (data) => {
      const frame = parseWsFrame(data);
      if (!frame) return;
      this.usageRecorder.tapGatewayFrame({
        projectId,
        userId,
        frame,
        pendingRuns,
        projectDataDir,
      });
      sendJson(client, frame);
    });

    upstream.on('close', (code, reason) => {
      client.close(code, String(reason));
    });

    upstream.on('error', () => {
      closeBoth(1011, 'upstream error');
    });

    client.on('message', (data) => {
      void this.handleClientMessage({
        client,
        upstream,
        projectId,
        userId,
        pendingRuns,
        data,
      });
    });

    client.on('close', () => {
      try {
        upstream.close();
      } catch {
        /* ignore */
      }
    });

    client.on('error', () => {
      closeBoth(1011, 'client error');
    });
  }

  private async handleClientMessage(params: {
    client: ClientSocket;
    upstream: UpstreamSocket;
    projectId: string;
    userId: string;
    pendingRuns: Map<string, PendingChatRun>;
    data: WsRaw;
  }): Promise<void> {
    const { client, upstream, projectId, userId, pendingRuns, data } = params;
    const frame = parseWsFrame(data);
    if (!frame) return;

    if (frame.type === 'req') {
      const method = frame.method;
      if (!isAllowedChatRpc(method)) {
        sendJson(client, {
          type: 'res',
          id: frame.id,
          ok: false,
          error: {
            code: 'METHOD_NOT_ALLOWED',
            message: `RPC method not allowed: ${String(method)}`,
          },
        });
        return;
      }
    }

    if (frame.type === 'req' && frame.method === 'connect') {
      sendJson(client, {
        type: 'res',
        id: frame.id,
        ok: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'connect is handled by the proxy',
        },
      });
      return;
    }

    if (frame.type === 'req' && frame.method === 'chat.send') {
      const enriched = await this.enrichChatSendFrame(frame, projectId, userId);
      if (enriched.error) {
        sendJson(client, {
          type: 'res',
          id: frame.id,
          ok: false,
          error: enriched.error,
        });
        return;
      }
      this.trackChatSendPending(enriched.frame ?? frame, pendingRuns);
      sendJson(upstream, enriched.frame);
      return;
    }

    sendJson(upstream, frame);
  }

  private async enrichChatSendFrame(
    frame: Record<string, unknown>,
    projectId: string,
    userId: string,
  ): Promise<{
    frame?: Record<string, unknown>;
    error?: { code: string; message: string };
  }> {
    const params =
      frame.params && typeof frame.params === 'object'
        ? ({ ...(frame.params as Record<string, unknown>) } as Record<
            string,
            unknown
          >)
        : {};

    const attachmentIds = asStringArray(params.attachmentIds);
    delete params.attachmentIds;

    if (!attachmentIds.length) {
      return { frame: { ...frame, params } };
    }

    const sessionKey =
      typeof params.sessionKey === 'string' ? params.sessionKey.trim() : '';
    const idempotencyKey =
      typeof params.idempotencyKey === 'string'
        ? params.idempotencyKey.trim()
        : '';

    try {
      const attachments = await this.attachments.buildChatSendAttachments({
        projectId,
        userId,
        attachmentIds,
        sessionKey,
      });

      await this.attachments.markLinked({
        projectId,
        userId,
        attachmentIds,
        sessionKey,
        linkedRunId: idempotencyKey || attachmentIds.join(','),
      });

      return {
        frame: {
          ...frame,
          params: {
            ...params,
            attachments,
          },
        },
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Attachment enrich failed';
      const code = message.startsWith('SANDBOX_ATTACHMENT_TOO_LARGE')
        ? 'SANDBOX_ATTACHMENT_TOO_LARGE'
        : 'ATTACHMENT_ENRICH_FAILED';
      return { error: { code, message } };
    }
  }

  private trackChatSendPending(
    frame: Record<string, unknown>,
    pendingRuns: Map<string, PendingChatRun>,
  ): void {
    const params =
      frame.params && typeof frame.params === 'object'
        ? (frame.params as Record<string, unknown>)
        : null;
    if (!params) return;

    const idempotencyKey =
      typeof params.idempotencyKey === 'string'
        ? params.idempotencyKey.trim()
        : '';
    if (!idempotencyKey) return;

    const sessionKey =
      typeof params.sessionKey === 'string' ? params.sessionKey.trim() : '';
    pendingRuns.set(idempotencyKey, {
      idempotencyKey,
      sessionKey,
      agentSlug: extractAgentSlugFromSessionKey(sessionKey),
      startedAt: Date.now(),
    });
  }
}
