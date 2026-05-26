import { EventEmitter } from 'node:events';
import WebSocket from 'ws';
import { isAllowedChatRpc, openGatewayUpstream } from '@aucobot/control-plane-core';

jest.mock('../workspace/workspace.service', () => ({
  WorkspaceService: class MockWorkspaceService {},
}));

jest.mock('@aucobot/control-plane-core', () => ({
  openGatewayUpstream: jest.fn(),
  isAllowedChatRpc: jest.fn((method: unknown) =>
    ['chat.history', 'chat.send', 'chat.abort', 'agents.list'].includes(String(method)),
  ),
}));

const openGatewayUpstreamMock = openGatewayUpstream as jest.MockedFunction<
  typeof openGatewayUpstream
>;
const isAllowedChatRpcMock = isAllowedChatRpc as jest.MockedFunction<typeof isAllowedChatRpc>;

import { ChatGatewayProxyService } from './chat.gateway-proxy.service';

const PROJECT_ID = 'proj_test_1';
const DATA_DIR = '/data/proj_test_1';

class MockSocket extends EventEmitter {
  OPEN = WebSocket.OPEN;
  readyState = WebSocket.OPEN;
  sent: string[] = [];
  closeCode?: number;
  closeReason?: string;

  send(data: string): void {
    this.sent.push(data);
  }

  close(code?: number, reason?: string): void {
    this.closeCode = code;
    this.closeReason = reason;
    this.emit('close', code ?? 1000, reason ?? '');
  }
}

function createService() {
  const workspace = {
    ensureProjectLayout: jest.fn().mockResolvedValue(DATA_DIR),
  };
  const service = new ChatGatewayProxyService(workspace as never);
  return { service, workspace };
}

function parseSent(socket: MockSocket): Record<string, unknown>[] {
  return socket.sent.map((s) => JSON.parse(s) as Record<string, unknown>);
}

describe('ChatGatewayProxyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isAllowedChatRpcMock.mockImplementation((method) =>
      ['chat.history', 'chat.send', 'chat.abort', 'agents.list'].includes(String(method)),
    );
  });

  describe('bridge', () => {
    it('sends proxy.error and closes client when upstream connect fails', async () => {
      const { service } = createService();
      openGatewayUpstreamMock.mockRejectedValue(new Error('ECONNREFUSED'));
      const client = new MockSocket();

      await service.bridge({
        client: client as unknown as WebSocket,
        projectId: PROJECT_ID,
        gatewayWsUrl: 'ws://127.0.0.1:18789',
        gatewayToken: 'gw-token',
      });

      const frames = parseSent(client);
      expect(frames).toContainEqual(
        expect.objectContaining({
          type: 'event',
          event: 'proxy.error',
          payload: expect.objectContaining({ code: 'GATEWAY_UNREACHABLE' }),
        }),
      );
      expect(client.closeCode).toBe(1011);
    });

    it('sends proxy.ready and relays allowed client requests to upstream', async () => {
      const { service, workspace } = createService();
      const client = new MockSocket();
      const upstream = new MockSocket();
      openGatewayUpstreamMock.mockResolvedValue(upstream as unknown as WebSocket);

      await service.bridge({
        client: client as unknown as WebSocket,
        projectId: PROJECT_ID,
        gatewayWsUrl: 'ws://127.0.0.1:18789',
        gatewayToken: 'gw-token',
      });

      expect(workspace.ensureProjectLayout).toHaveBeenCalledWith(PROJECT_ID);
      expect(parseSent(client)).toContainEqual(
        expect.objectContaining({ type: 'event', event: 'proxy.ready' }),
      );

      client.emit(
        'message',
        JSON.stringify({ type: 'req', id: 'req-1', method: 'chat.send', params: { text: 'hi' } }),
      );

      expect(parseSent(upstream)).toContainEqual(
        expect.objectContaining({ type: 'req', method: 'chat.send' }),
      );
    });

    it('blocks disallowed rpc methods on client side', async () => {
      const { service } = createService();
      const client = new MockSocket();
      const upstream = new MockSocket();
      openGatewayUpstreamMock.mockResolvedValue(upstream as unknown as WebSocket);

      await service.bridge({
        client: client as unknown as WebSocket,
        projectId: PROJECT_ID,
        gatewayWsUrl: 'ws://127.0.0.1:18789',
        gatewayToken: 'gw-token',
      });

      client.emit(
        'message',
        JSON.stringify({ type: 'req', id: 'req-2', method: 'config.patch', params: {} }),
      );

      const frames = parseSent(client);
      expect(frames).toContainEqual(
        expect.objectContaining({
          type: 'res',
          id: 'req-2',
          ok: false,
          error: expect.objectContaining({ code: 'METHOD_NOT_ALLOWED' }),
        }),
      );
      expect(parseSent(upstream)).toHaveLength(0);
    });

    it('blocks client connect rpc (handled by proxy)', async () => {
      const { service } = createService();
      const client = new MockSocket();
      const upstream = new MockSocket();
      openGatewayUpstreamMock.mockResolvedValue(upstream as unknown as WebSocket);
      isAllowedChatRpcMock.mockReturnValue(true);

      await service.bridge({
        client: client as unknown as WebSocket,
        projectId: PROJECT_ID,
        gatewayWsUrl: 'ws://127.0.0.1:18789',
        gatewayToken: 'gw-token',
      });

      client.emit(
        'message',
        JSON.stringify({ type: 'req', id: 'req-3', method: 'connect', params: {} }),
      );

      const frames = parseSent(client);
      expect(frames).toContainEqual(
        expect.objectContaining({
          type: 'res',
          id: 'req-3',
          ok: false,
          error: expect.objectContaining({ message: 'connect is handled by the proxy' }),
        }),
      );
      expect(parseSent(upstream)).toHaveLength(0);
    });

    it('forwards upstream messages to client', async () => {
      const { service } = createService();
      const client = new MockSocket();
      const upstream = new MockSocket();
      openGatewayUpstreamMock.mockResolvedValue(upstream as unknown as WebSocket);

      await service.bridge({
        client: client as unknown as WebSocket,
        projectId: PROJECT_ID,
        gatewayWsUrl: 'ws://127.0.0.1:18789',
        gatewayToken: 'gw-token',
      });

      upstream.emit(
        'message',
        JSON.stringify({ type: 'event', event: 'chat', payload: { state: 'delta' } }),
      );

      expect(parseSent(client)).toContainEqual(
        expect.objectContaining({ type: 'event', event: 'chat' }),
      );
    });
  });
});
