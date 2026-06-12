import { EventEmitter } from 'node:events';
import WebSocket from 'ws';
import { ProjectStatus } from '@aucobot/database';
import { openGatewayUpstream } from '@aucobot/control-plane-core';
import { isOssRuntime } from '@aucobot/runtime-contracts';
import { resolveOssGatewayEndpoint } from '@aucobot/runtime-oss';

jest.mock('@aucobot/control-plane-core', () => ({
  openGatewayUpstream: jest.fn(),
}));

jest.mock('@aucobot/runtime-contracts', () => ({
  isOssRuntime: jest.fn(() => true),
}));

jest.mock('@aucobot/runtime-oss', () => ({
  resolveOssGatewayEndpoint: jest.fn(() => ({
    httpBaseUrl: 'http://127.0.0.1:18789',
    wsBaseUrl: 'ws://127.0.0.1:18789',
    token: 'gw-token',
  })),
}));

jest.mock('../../../workspace/services/workspace/workspace.service', () => ({
  WorkspaceService: class MockWorkspaceService {},
}));

jest.mock('../model-usage-recorder/model-usage-recorder.service', () => ({
  ModelUsageRecorderService: class MockModelUsageRecorderService {},
}));

const openGatewayUpstreamMock = openGatewayUpstream as jest.MockedFunction<
  typeof openGatewayUpstream
>;
const isOssRuntimeMock = isOssRuntime as jest.MockedFunction<typeof isOssRuntime>;
const resolveOssGatewayEndpointMock = resolveOssGatewayEndpoint as jest.MockedFunction<
  typeof resolveOssGatewayEndpoint
>;

import { GatewayUsageSubscriberService } from './gateway-usage-subscriber.service';

const gatewayEndpointFixture = {
  httpBaseUrl: 'http://127.0.0.1:18789',
  wsBaseUrl: 'ws://127.0.0.1:18789',
  token: 'gw-token',
};

const PROJECT_ID = 'proj_usage_sub_1';
const USER_ID = 'user_owner_1';
const DATA_DIR = '/data/proj_usage_sub_1';

class MockUpstream extends EventEmitter {
  OPEN = WebSocket.OPEN;
  readyState: number = WebSocket.OPEN;

  close(): void {
    this.readyState = WebSocket.CLOSED as number;
    this.emit('close', 1000, 'closed');
  }
}

function createService() {
  const prisma = {
    project: {
      findMany: jest.fn(),
    },
  };
  const workspace = {
    ensureProjectLayout: jest.fn().mockResolvedValue(DATA_DIR),
  };
  const usageRecorder = {
    tapGatewayFrame: jest.fn(),
  };
  const service = new GatewayUsageSubscriberService(
    prisma as never,
    workspace as never,
    usageRecorder as never,
  );
  return { service, prisma, workspace, usageRecorder };
}

describe('GatewayUsageSubscriberService', () => {
  const originalSubscriberFlag = process.env.USAGE_SUBSCRIBER_ENABLED;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    delete process.env.USAGE_SUBSCRIBER_ENABLED;
    isOssRuntimeMock.mockReturnValue(true);
    resolveOssGatewayEndpointMock.mockReturnValue(gatewayEndpointFixture);
  });

  afterEach(() => {
    jest.useRealTimers();
    if (originalSubscriberFlag === undefined) {
      delete process.env.USAGE_SUBSCRIBER_ENABLED;
    } else {
      process.env.USAGE_SUBSCRIBER_ENABLED = originalSubscriberFlag;
    }
  });

  it('does nothing when not OSS runtime', async () => {
    isOssRuntimeMock.mockReturnValue(false);
    const { service, prisma } = createService();

    service.onModuleInit();
    await jest.runOnlyPendingTimersAsync();

    expect(prisma.project.findMany).not.toHaveBeenCalled();
  });

  it('does nothing when USAGE_SUBSCRIBER_ENABLED=false', async () => {
    process.env.USAGE_SUBSCRIBER_ENABLED = 'false';
    const { service, prisma } = createService();

    service.onModuleInit();
    await jest.runOnlyPendingTimersAsync();

    expect(prisma.project.findMany).not.toHaveBeenCalled();
  });

  it('connects for RUNNING projects and taps gateway frames', async () => {
    const upstream = new MockUpstream();
    openGatewayUpstreamMock.mockResolvedValue(upstream as never);

    const { service, prisma, workspace, usageRecorder } = createService();
    prisma.project.findMany.mockResolvedValue([
      {
        id: PROJECT_ID,
        userId: USER_ID,
        gatewayToken: 'token-1',
      },
    ]);

    await service.reconcileAll();

    expect(workspace.ensureProjectLayout).toHaveBeenCalledWith(PROJECT_ID);
    expect(openGatewayUpstreamMock).toHaveBeenCalledWith(
      'ws://127.0.0.1:18789',
      'gw-token',
      DATA_DIR,
    );

    upstream.emit(
      'message',
      JSON.stringify({
        type: 'event',
        event: 'chat',
        payload: {
          state: 'final',
          idempotencyKey: 'idem-1',
          model: 'openai/gpt-5.4-mini',
          usage: { inputTokens: 10, outputTokens: 5 },
        },
      }),
    );

    expect(usageRecorder.tapGatewayFrame).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: PROJECT_ID,
        userId: USER_ID,
        frame: expect.objectContaining({ event: 'chat' }),
      }),
    );
  });

  it('stops subscription when project is no longer RUNNING', async () => {
    const upstream = new MockUpstream();
    const closeSpy = jest.spyOn(upstream, 'close');
    openGatewayUpstreamMock.mockResolvedValue(upstream as never);

    const { service, prisma } = createService();
    prisma.project.findMany.mockResolvedValueOnce([
      {
        id: PROJECT_ID,
        userId: USER_ID,
        gatewayToken: 'token-1',
      },
    ]);
    await service.reconcileAll();

    prisma.project.findMany.mockResolvedValueOnce([]);
    await service.reconcileAll();

    expect(closeSpy).toHaveBeenCalled();
  });

  it('schedules reconnect after upstream closes', async () => {
    const upstream = new MockUpstream();
    openGatewayUpstreamMock.mockResolvedValue(upstream as never);

    const { service, prisma } = createService();
    prisma.project.findMany.mockResolvedValue([
      {
        id: PROJECT_ID,
        userId: USER_ID,
        gatewayToken: 'token-1',
      },
    ]);

    await service.reconcileAll();
    expect(openGatewayUpstreamMock).toHaveBeenCalledTimes(1);

    upstream.close();
    await jest.advanceTimersByTimeAsync(2_000);

    expect(openGatewayUpstreamMock).toHaveBeenCalledTimes(2);
  });

  it('onModuleInit queries RUNNING projects', async () => {
    const upstream = new MockUpstream();
    openGatewayUpstreamMock.mockResolvedValue(upstream as never);

    const { service, prisma } = createService();
    prisma.project.findMany.mockResolvedValue([]);

    service.onModuleInit();
    await Promise.resolve();

    expect(prisma.project.findMany).toHaveBeenCalledWith({
      where: { status: ProjectStatus.RUNNING },
      select: { id: true, userId: true, gatewayToken: true },
    });
  });

  it('onApplicationShutdown closes active upstream connections', async () => {
    const upstream = new MockUpstream();
    const closeSpy = jest.spyOn(upstream, 'close');
    openGatewayUpstreamMock.mockResolvedValue(upstream as never);

    const { service, prisma } = createService();
    prisma.project.findMany.mockResolvedValue([
      {
        id: PROJECT_ID,
        userId: USER_ID,
        gatewayToken: 'token-1',
      },
    ]);

    await service.reconcileAll();
    service.onApplicationShutdown();

    expect(closeSpy).toHaveBeenCalled();
  });
});
