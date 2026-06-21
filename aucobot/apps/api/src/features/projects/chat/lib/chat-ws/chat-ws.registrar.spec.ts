jest.mock('../../../services/projects/projects.service', () => ({
  ProjectsService: class MockProjectsService {},
}));

jest.mock(
  '../../services/chat-gateway-proxy/chat.gateway-proxy.service',
  () => ({
    ChatGatewayProxyService: class MockChatGatewayProxyService {},
  }),
);

jest.mock('@aucobot/control-plane-core', () => ({
  extractAccessTokenFromRequest: jest.fn(),
  verifyAccessToken: jest.fn(),
}));

import { Logger } from '@nestjs/common';

import { ChatWsRegistrar } from './chat-ws.registrar';
import {
  extractAccessTokenFromRequest,
  verifyAccessToken,
} from '@aucobot/control-plane-core';

const extractAccessTokenFromRequestMock =
  extractAccessTokenFromRequest as jest.MockedFunction<
    typeof extractAccessTokenFromRequest
  >;
const verifyAccessTokenMock = verifyAccessToken as jest.MockedFunction<
  typeof verifyAccessToken
>;

const PROJECT_ID = 'proj_test_1';
const USER_ID = 'user_test_1';

function createRegistrar(params?: {
  hasWebsocket?: boolean;
  getRuntime?: jest.Mock;
  bridge?: jest.Mock;
}) {
  const getHandler = jest.fn();
  const fastify = {
    hasPlugin: jest.fn().mockReturnValue(params?.hasWebsocket ?? true),
    get: getHandler,
  };
  const adapterHost = {
    httpAdapter: {
      getInstance: jest.fn().mockReturnValue(fastify),
    },
  };
  const projects = {
    getRuntimeForChat: params?.getRuntime ?? jest.fn(),
  };
  const proxy = {
    bridge: params?.bridge ?? jest.fn().mockResolvedValue(undefined),
  };
  const registrar = new ChatWsRegistrar(
    adapterHost as never,
    projects as never,
    proxy as never,
  );
  return { registrar, fastify, getHandler, projects, proxy };
}

function createSocket() {
  return {
    close: jest.fn(),
  };
}

describe('ChatWsRegistrar', () => {
  let warnSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    logSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
    logSpy.mockRestore();
  });

  describe('onApplicationBootstrap', () => {
    it('warns and skips route when @fastify/websocket is missing', () => {
      const { registrar, getHandler } = createRegistrar({
        hasWebsocket: false,
      });

      registrar.onApplicationBootstrap();

      expect(warnSpy).toHaveBeenCalledWith(
        '@fastify/websocket not loaded — chat proxy disabled',
      );
      expect(getHandler).not.toHaveBeenCalled();
    });

    it('registers websocket route when plugin is loaded', () => {
      const { registrar, getHandler } = createRegistrar();

      registrar.onApplicationBootstrap();

      expect(getHandler).toHaveBeenCalledWith(
        '/api/projects/:projectId/chat/ws',
        { websocket: true },
        expect.any(Function),
      );
      expect(logSpy).toHaveBeenCalledWith(
        'Chat WebSocket proxy: GET /api/projects/:projectId/chat/ws',
      );
    });
  });

  describe('handleConnection', () => {
    async function invokeHandler(
      registrar: ChatWsRegistrar,
      getHandler: jest.Mock,
      socket: ReturnType<typeof createSocket>,
      req: Record<string, unknown>,
    ) {
      registrar.onApplicationBootstrap();
      const handler = getHandler.mock.calls[0][2] as (
        socket: ReturnType<typeof createSocket>,
        req: Record<string, unknown>,
      ) => void;
      handler(socket, req);
      await new Promise<void>((resolve) => {
        setImmediate(resolve);
      });
    }

    it('closes with 1008 when project id is missing', async () => {
      const { registrar, getHandler } = createRegistrar();
      const socket = createSocket();

      await invokeHandler(registrar, getHandler, socket, {
        params: { projectId: '   ' },
      });

      expect(socket.close).toHaveBeenCalledWith(1008, 'missing project id');
    });

    it('closes with 1008 when token is invalid', async () => {
      const { registrar, getHandler } = createRegistrar();
      const socket = createSocket();
      extractAccessTokenFromRequestMock.mockReturnValue(undefined);
      verifyAccessTokenMock.mockReturnValue(null);

      await invokeHandler(registrar, getHandler, socket, {
        params: { projectId: PROJECT_ID },
      });

      expect(socket.close).toHaveBeenCalledWith(1008, 'unauthorized');
    });

    it('closes with 1008 when project lookup fails', async () => {
      const getRuntime = jest.fn().mockRejectedValue(new Error('not found'));
      const { registrar, getHandler } = createRegistrar({ getRuntime });
      const socket = createSocket();
      extractAccessTokenFromRequestMock.mockReturnValue('token');
      verifyAccessTokenMock.mockReturnValue({ sub: USER_ID } as never);

      await invokeHandler(registrar, getHandler, socket, {
        params: { projectId: PROJECT_ID },
      });

      expect(getRuntime).toHaveBeenCalledWith(USER_ID, PROJECT_ID);
      expect(socket.close).toHaveBeenCalledWith(1008, 'project not found');
    });

    it('closes with 1013 when runtime is not ready', async () => {
      const getRuntime = jest.fn().mockResolvedValue({
        ready: false,
        reason: 'stopped',
      });
      const { registrar, getHandler } = createRegistrar({ getRuntime });
      const socket = createSocket();
      extractAccessTokenFromRequestMock.mockReturnValue('token');
      verifyAccessTokenMock.mockReturnValue({ sub: USER_ID } as never);

      await invokeHandler(registrar, getHandler, socket, {
        params: { projectId: PROJECT_ID },
      });

      expect(socket.close).toHaveBeenCalledWith(1013, 'project not running');
    });

    it('bridges client to gateway when runtime is ready', async () => {
      const bridge = jest.fn().mockResolvedValue(undefined);
      const getRuntime = jest.fn().mockResolvedValue({
        ready: true,
        gatewayWsUrl: 'ws://127.0.0.1:18789',
        gatewayToken: 'gw-token',
      });
      const { registrar, getHandler, proxy } = createRegistrar({
        getRuntime,
        bridge,
      });
      const socket = createSocket();
      extractAccessTokenFromRequestMock.mockReturnValue('token');
      verifyAccessTokenMock.mockReturnValue({ sub: USER_ID } as never);

      await invokeHandler(registrar, getHandler, socket, {
        params: { projectId: PROJECT_ID },
      });

      expect(proxy.bridge).toHaveBeenCalledWith({
        client: socket,
        projectId: PROJECT_ID,
        userId: USER_ID,
        gatewayWsUrl: 'ws://127.0.0.1:18789',
        gatewayToken: 'gw-token',
      });
      expect(socket.close).not.toHaveBeenCalled();
    });
  });
});
