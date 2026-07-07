import { ModelUsageRecorderService } from './model-usage-recorder.service';
import { Prisma, UsageSource, UsageStatus } from '@claw-dashboard/database';

const PROJECT_ID = 'proj_test_1';
const USER_ID = 'user_test_1';

function createService() {
  const prisma = {
    modelUsageEvent: {
      create: jest.fn().mockResolvedValue({}),
    },
  };
  const service = new ModelUsageRecorderService(prisma as never);
  return { service, prisma };
}

describe('ModelUsageRecorderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates event with computed costUsd from the bundled catalog', async () => {
    const { service, prisma } = createService();

    // openai/gpt-5.4-mini = 0.4 in / 1.6 out per 1M tokens
    // 1,000,000 in * 0.4 + 500,000 out * 1.6 = 0.4 + 0.8 = 1.2
    await service.record({
      projectId: PROJECT_ID,
      userId: USER_ID,
      source: UsageSource.OTHER,
      status: UsageStatus.SUCCESS,
      modelId: 'openai/gpt-5.4-mini',
      providerId: 'openai',
      inputTokens: 1_000_000,
      outputTokens: 500_000,
      externalId: 'editor:agent:req-1',
    });

    expect(prisma.modelUsageEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          costUsd: '1.2',
          inputTokens: 1_000_000,
          outputTokens: 500_000,
        }),
      }),
    );
  });

  it('uses costUsd 0 when no pricing entry matches', async () => {
    const { service, prisma } = createService();

    await service.record({
      projectId: PROJECT_ID,
      userId: USER_ID,
      source: UsageSource.CHAT_UI,
      status: UsageStatus.SUCCESS,
      modelId: 'unknown-model',
      providerId: 'openai',
      inputTokens: 10,
      outputTokens: 5,
    });

    expect(prisma.modelUsageEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ costUsd: '0' }),
      }),
    );
  });

  it('swallows duplicate externalId unique violations', async () => {
    const { service, prisma } = createService();
    prisma.modelUsageEvent.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(
      service.record({
        projectId: PROJECT_ID,
        userId: USER_ID,
        source: UsageSource.CHAT_UI,
        status: UsageStatus.SUCCESS,
        modelId: 'openai/gpt-5.4-mini',
        providerId: 'openai',
        externalId: 'chat:dup',
      }),
    ).resolves.toBeUndefined();
  });

  it('tapGatewayFrame records parsed chat final events', async () => {
    const { service, prisma } = createService();
    const pendingRuns = new Map([
      [
        'run-1',
        {
          idempotencyKey: 'run-1',
          sessionKey: 'agent:main:direct',
          agentSlug: 'main',
          startedAt: Date.now() - 500,
        },
      ],
    ]);

    service.tapGatewayFrame({
      projectId: PROJECT_ID,
      userId: USER_ID,
      pendingRuns,
      frame: {
        type: 'event',
        event: 'chat',
        payload: {
          state: 'final',
          runId: 'run-1',
          idempotencyKey: 'run-1',
          model: 'openai/gpt-5.4-mini',
          usage: { inputTokens: 12, outputTokens: 4 },
        },
      },
    });

    await new Promise<void>((resolve) => {
      setImmediate(resolve);
    });

    expect(prisma.modelUsageEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          source: UsageSource.CHAT_UI,
          status: UsageStatus.SUCCESS,
          externalId: 'run:run-1',
        }),
      }),
    );
    expect(pendingRuns.has('run-1')).toBe(false);
  });
});
