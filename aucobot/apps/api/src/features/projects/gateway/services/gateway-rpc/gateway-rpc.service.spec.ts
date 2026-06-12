import { ServiceUnavailableException } from '@nestjs/common';

const callGatewayRpcMock = jest.fn();

jest.mock('@aucobot/control-plane-core', () => ({
  callGatewayRpc: (...args: unknown[]) => callGatewayRpcMock(...args),
  GatewayRpcError: class GatewayRpcError extends Error {
    code?: string;
    constructor(message: string, code?: string) {
      super(message);
      this.name = 'GatewayRpcError';
      this.code = code;
    }
  },
}));

jest.mock('../../../workspace/services/workspace/workspace.service', () => ({
  WorkspaceService: class MockWorkspaceService {},
}));

jest.mock('../../../services/projects/projects.service', () => ({
  ProjectsService: class MockProjectsService {},
}));

import { GatewayRpcError } from '@aucobot/control-plane-core';
import { GatewayRpcService } from './gateway-rpc.service';

const USER_ID = 'user_test_1';
const PROJECT_ID = 'proj_test_1';

function createService() {
  const projects = {
    getRuntimeForChat: jest.fn(),
  };
  const workspace = {
    ensureProjectLayout: jest.fn().mockResolvedValue('/data/proj_test_1'),
  };
  const service = new GatewayRpcService(projects as never, workspace as never);
  return { service, projects, workspace };
}

describe('GatewayRpcService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls gateway RPC when runtime is ready', async () => {
    const { service, projects, workspace } = createService();
    projects.getRuntimeForChat.mockResolvedValue({
      ready: true,
      gatewayWsUrl: 'ws://127.0.0.1:18789',
      gatewayToken: 'gw-token',
    });
    callGatewayRpcMock.mockResolvedValue({ jobs: [] });

    const result = await service.call(USER_ID, PROJECT_ID, 'cron.list', {
      limit: 10,
    });

    expect(projects.getRuntimeForChat).toHaveBeenCalledWith(USER_ID, PROJECT_ID);
    expect(workspace.ensureProjectLayout).toHaveBeenCalledWith(PROJECT_ID);
    expect(callGatewayRpcMock).toHaveBeenCalledWith(
      'ws://127.0.0.1:18789',
      'gw-token',
      '/data/proj_test_1',
      'cron.list',
      { limit: 10 },
    );
    expect(result).toEqual({ jobs: [] });
  });

  it('throws ServiceUnavailableException when runtime is not ready', async () => {
    const { service, projects, workspace } = createService();
    projects.getRuntimeForChat.mockResolvedValue({
      ready: false,
      reason: 'PROJECT_NOT_RUNNING',
    });

    await expect(service.call(USER_ID, PROJECT_ID, 'cron.list')).rejects.toThrow(
      ServiceUnavailableException,
    );
    await expect(service.call(USER_ID, PROJECT_ID, 'cron.list')).rejects.toMatchObject({
      response: {
        code: 'PROJECT_NOT_RUNNING',
        message: 'Project gateway is not available',
      },
    });
    expect(workspace.ensureProjectLayout).not.toHaveBeenCalled();
    expect(callGatewayRpcMock).not.toHaveBeenCalled();
  });

  it('maps GatewayRpcError to ServiceUnavailableException', async () => {
    const { service, projects } = createService();
    projects.getRuntimeForChat.mockResolvedValue({
      ready: true,
      gatewayWsUrl: 'ws://127.0.0.1:18789',
      gatewayToken: 'gw-token',
    });
    callGatewayRpcMock.mockRejectedValue(new GatewayRpcError('cron.list failed', 'RPC_ERR'));

    await expect(service.call(USER_ID, PROJECT_ID, 'cron.list')).rejects.toThrow(
      new ServiceUnavailableException('cron.list failed'),
    );
  });

  it('rethrows unexpected errors from callGatewayRpc', async () => {
    const { service, projects } = createService();
    projects.getRuntimeForChat.mockResolvedValue({
      ready: true,
      gatewayWsUrl: 'ws://127.0.0.1:18789',
      gatewayToken: 'gw-token',
    });
    const unexpected = new Error('socket hang up');
    callGatewayRpcMock.mockRejectedValue(unexpected);

    await expect(service.call(USER_ID, PROJECT_ID, 'nodes.list')).rejects.toBe(unexpected);
  });
});
