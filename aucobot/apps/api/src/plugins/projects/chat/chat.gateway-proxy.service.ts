import { Injectable, Logger } from '@nestjs/common';
import WebSocket, { type RawData } from 'ws';
import { ProjectWorkspaceService } from '../workspace/project-workspace.service';
import { isAllowedChatRpc, openGatewayUpstream } from '@aucobot/control-plane-core';

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

@Injectable()
export class ChatGatewayProxyService {
  private readonly log = new Logger(ChatGatewayProxyService.name);

  constructor(private readonly workspace: ProjectWorkspaceService) {}

  async bridge(params: {
    client: ClientSocket;
    projectId: string;
    gatewayWsUrl: string;
    gatewayToken: string;
  }): Promise<void> {
    const { client, projectId, gatewayWsUrl, gatewayToken } = params;
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

      sendJson(upstream, frame);
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
}
