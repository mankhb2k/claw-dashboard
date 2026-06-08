import { Injectable, Logger } from '@nestjs/common';
import WebSocket, { type RawData } from 'ws';
import { WorkspaceService } from '../workspace/workspace.service';
import { isAllowedChatRpc, openGatewayUpstream } from '@aucobot/control-plane-core';
import { ChatAttachmentsService } from './chat-attachments.service';

type ClientSocket = WebSocket;
type UpstreamSocket = WebSocket;
type WsRaw = RawData;

function sendJson(socket: WebSocket, frame: unknown): void {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(frame));
  }
}

function parseFrame(raw: WsRaw): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(String(raw)) as Record<string, unknown>;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
}

@Injectable()
export class ChatGatewayProxyService {
  private readonly log = new Logger(ChatGatewayProxyService.name);

  constructor(
    private readonly workspace: WorkspaceService,
    private readonly attachments: ChatAttachmentsService,
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
      upstream = await openGatewayUpstream(gatewayWsUrl, gatewayToken, projectDataDir);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'GATEWAY_UNREACHABLE';
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
      const frame = parseFrame(data);
      if (!frame) return;
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
    data: WsRaw;
  }): Promise<void> {
    const { client, upstream, projectId, userId, data } = params;
    const frame = parseFrame(data);
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
        ? ({ ...(frame.params as Record<string, unknown>) } as Record<string, unknown>)
        : {};

    const attachmentIds = asStringArray(params.attachmentIds);
    delete params.attachmentIds;

    if (!attachmentIds.length) {
      return { frame: { ...frame, params } };
    }

    const sessionKey =
      typeof params.sessionKey === 'string' ? params.sessionKey.trim() : '';
    const idempotencyKey =
      typeof params.idempotencyKey === 'string' ? params.idempotencyKey.trim() : '';

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
      const message = err instanceof Error ? err.message : 'Attachment enrich failed';
      const code = message.startsWith('SANDBOX_ATTACHMENT_TOO_LARGE')
        ? 'SANDBOX_ATTACHMENT_TOO_LARGE'
        : 'ATTACHMENT_ENRICH_FAILED';
      return { error: { code, message } };
    }
  }
}
