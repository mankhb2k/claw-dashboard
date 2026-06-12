import { BadRequestException, NotFoundException } from '@nestjs/common';

jest.mock('../../../gateway/services/gateway-rpc/gateway-rpc.service', () => ({
  GatewayRpcService: class MockGatewayRpcService {},
}));

jest.mock('../../../usage/services/model-usage-recorder/model-usage-recorder.service', () => ({
  ModelUsageRecorderService: class MockModelUsageRecorderService {},
}));

import { CronService } from './cron.service';

const USER_ID = 'user_test_1';
const PROJECT_ID = 'proj_test_1';
const JOB_ID = 'job-1';
const LIMIT = Number(process.env.CRON_JOBS_PER_PROJECT_LIMIT ?? 20) || 20;

function createService() {
  const gateway = {
    call: jest.fn(),
  };
  const usageRecorder = {
    recordFireAndForget: jest.fn(),
  };
  const service = new CronService(gateway as never, usageRecorder as never);
  return { service, gateway, usageRecorder };
}

const sampleJob = {
  id: JOB_ID,
  name: 'Daily digest',
  agentId: 'main',
  enabled: true,
  schedule: { kind: 'cron' as const, expr: '0 9 * * *' },
  payload: { kind: 'agentTurn', message: 'Run digest' },
  state: { lastRunStatus: 'ok' },
};

describe('CronService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSummary', () => {
    it('aggregates gateway status and failed jobs', async () => {
      const { service, gateway } = createService();
      gateway.call
        .mockResolvedValueOnce({ enabled: true, jobCount: 3 })
        .mockResolvedValueOnce({
          jobs: [
            sampleJob,
            { ...sampleJob, id: 'job-2', state: { lastRunStatus: 'error' } },
            { ...sampleJob, id: 'job-3', state: { lastStatus: 'failed' } },
          ],
          total: 3,
        });

      const summary = await service.getSummary(USER_ID, PROJECT_ID);

      expect(gateway.call).toHaveBeenNthCalledWith(
        1,
        USER_ID,
        PROJECT_ID,
        'cron.status',
        {},
      );
      expect(gateway.call).toHaveBeenNthCalledWith(2, USER_ID, PROJECT_ID, 'cron.list', {
        includeDisabled: true,
        limit: 500,
        offset: 0,
      });
      expect(summary).toEqual({
        enabled: true,
        jobCount: 3,
        total: 3,
        limit: LIMIT,
        remaining: LIMIT - 3,
        failedCount: 2,
        recentFailures: [
          { id: 'job-2', name: 'Daily digest', agentId: 'main' },
          { id: 'job-3', name: 'Daily digest', agentId: 'main' },
        ],
      });
    });
  });

  describe('list', () => {
    it('passes sort options and optional agentId filter', async () => {
      const { service, gateway } = createService();
      gateway.call.mockResolvedValue({ jobs: [sampleJob], total: 1 });

      await service.list(USER_ID, PROJECT_ID, '  support  ');

      expect(gateway.call).toHaveBeenCalledWith(USER_ID, PROJECT_ID, 'cron.list', {
        includeDisabled: true,
        limit: 200,
        offset: 0,
        sortBy: 'nextRunAtMs',
        sortDir: 'asc',
        agentId: 'support',
      });
    });
  });

  describe('get', () => {
    it('returns job from gateway', async () => {
      const { service, gateway } = createService();
      gateway.call.mockResolvedValue(sampleJob);

      const job = await service.get(USER_ID, PROJECT_ID, JOB_ID);

      expect(job).toEqual(sampleJob);
      expect(gateway.call).toHaveBeenCalledWith(USER_ID, PROJECT_ID, 'cron.get', {
        id: JOB_ID,
      });
    });

    it('throws NotFoundException when gateway returns null', async () => {
      const { service, gateway } = createService();
      gateway.call.mockResolvedValue(null);

      await expect(service.get(USER_ID, PROJECT_ID, JOB_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('rejects when project job limit is reached', async () => {
      const { service, gateway } = createService();
      gateway.call.mockResolvedValue({ total: LIMIT });

      await expect(
        service.create(USER_ID, PROJECT_ID, {
          name: 'New job',
          agentId: 'main',
          message: 'Hello',
          scheduleKind: 'every',
          everyMinutes: 30,
        }),
      ).rejects.toThrow(
        new BadRequestException(`Cron job limit reached (${LIMIT} per project)`),
      );
    });

    it('creates cron schedule job via cron.add', async () => {
      const { service, gateway } = createService();
      gateway.call
        .mockResolvedValueOnce({ total: 1 })
        .mockResolvedValueOnce(sampleJob);

      const created = await service.create(USER_ID, PROJECT_ID, {
        name: '  Daily digest  ',
        agentId: ' main ',
        message: ' Run digest ',
        scheduleKind: 'cron',
        cronExpr: '0 9 * * *',
        enabled: true,
      });

      expect(created).toEqual(sampleJob);
      expect(gateway.call).toHaveBeenLastCalledWith(USER_ID, PROJECT_ID, 'cron.add', {
        name: 'Daily digest',
        agentId: 'main',
        enabled: true,
        schedule: { kind: 'cron', expr: '0 9 * * *' },
        sessionTarget: 'isolated',
        wakeMode: 'now',
        payload: { kind: 'agentTurn', message: 'Run digest' },
      });
    });

    it('creates every schedule with default 60 minutes', async () => {
      const { service, gateway } = createService();
      gateway.call.mockResolvedValueOnce({ total: 0 }).mockResolvedValueOnce(sampleJob);

      await service.create(USER_ID, PROJECT_ID, {
        name: 'Poll',
        agentId: 'main',
        message: 'Check inbox',
        scheduleKind: 'every',
      });

      expect(gateway.call).toHaveBeenLastCalledWith(
        USER_ID,
        PROJECT_ID,
        'cron.add',
        expect.objectContaining({
          schedule: { kind: 'every', everyMs: 3_600_000 },
        }),
      );
    });

    it('requires cronExpr for cron schedule kind', async () => {
      const { service, gateway } = createService();
      gateway.call.mockResolvedValueOnce({ total: 0 });

      await expect(
        service.create(USER_ID, PROJECT_ID, {
          name: 'Bad',
          agentId: 'main',
          message: 'x',
          scheduleKind: 'cron',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('requires at for one-shot schedule kind', async () => {
      const { service, gateway } = createService();
      gateway.call.mockResolvedValueOnce({ total: 0 });

      await expect(
        service.create(USER_ID, PROJECT_ID, {
          name: 'Once',
          agentId: 'main',
          message: 'x',
          scheduleKind: 'at',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('patches message and enabled fields', async () => {
      const { service, gateway } = createService();
      gateway.call
        .mockResolvedValueOnce(sampleJob)
        .mockResolvedValueOnce({ ...sampleJob, enabled: false });

      await service.update(USER_ID, PROJECT_ID, JOB_ID, {
        message: ' Updated ',
        enabled: false,
      });

      expect(gateway.call).toHaveBeenLastCalledWith(USER_ID, PROJECT_ID, 'cron.update', {
        id: JOB_ID,
        patch: {
          enabled: false,
          payload: { kind: 'agentTurn', message: 'Updated' },
        },
      });
    });

    it('rebuilds schedule when scheduleKind changes', async () => {
      const { service, gateway } = createService();
      gateway.call
        .mockResolvedValueOnce({
          ...sampleJob,
          schedule: { kind: 'every', everyMs: 1_800_000 },
        })
        .mockResolvedValueOnce(sampleJob);

      await service.update(USER_ID, PROJECT_ID, JOB_ID, {
        scheduleKind: 'cron',
        cronExpr: '0 0 * * *',
      });

      expect(gateway.call).toHaveBeenLastCalledWith(USER_ID, PROJECT_ID, 'cron.update', {
        id: JOB_ID,
        patch: {
          schedule: { kind: 'cron', expr: '0 0 * * *' },
        },
      });
    });
  });

  describe('remove', () => {
    it('calls cron.remove with job id', async () => {
      const { service, gateway } = createService();
      gateway.call.mockResolvedValue({ removed: true });

      const result = await service.remove(USER_ID, PROJECT_ID, JOB_ID);

      expect(result).toEqual({ removed: true });
      expect(gateway.call).toHaveBeenCalledWith(USER_ID, PROJECT_ID, 'cron.remove', {
        id: JOB_ID,
      });
    });
  });

  describe('run', () => {
    it('forces immediate run via cron.run', async () => {
      const { service, gateway, usageRecorder } = createService();
      gateway.call.mockResolvedValue({ ok: true });

      await service.run(USER_ID, PROJECT_ID, JOB_ID);

      expect(gateway.call).toHaveBeenCalledWith(USER_ID, PROJECT_ID, 'cron.run', {
        id: JOB_ID,
        mode: 'force',
      });
      expect(usageRecorder.recordFireAndForget).not.toHaveBeenCalled();
    });

    it('records usage when cron.run response includes runId and usage', async () => {
      const { service, gateway, usageRecorder } = createService();
      gateway.call.mockResolvedValue({
        runId: 'run-9',
        agentId: 'main',
        model: 'openai/gpt-5.4-mini',
        usage: { inputTokens: 10, outputTokens: 4 },
      });

      await service.run(USER_ID, PROJECT_ID, JOB_ID);

      expect(usageRecorder.recordFireAndForget).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: PROJECT_ID,
          userId: USER_ID,
          externalId: 'cron:job-1:run-9',
          source: 'CRON',
        }),
      );
    });
  });
});
