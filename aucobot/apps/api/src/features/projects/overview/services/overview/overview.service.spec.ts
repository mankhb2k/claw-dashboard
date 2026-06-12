import { BadRequestException } from '@nestjs/common';

const resolveMetricsDateRangeMock = jest.fn();

jest.mock('../../lib/overview-timezone.util', () => ({
  ...jest.requireActual('../../lib/overview-timezone.util'),
  resolveMetricsDateRange: (...args: unknown[]) => resolveMetricsDateRangeMock(...args),
}));

import { OverviewService } from './overview.service';

const USER_ID = 'user_test_1';
const PROJECT_ID = 'proj_test_1';

function createService() {
  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
    $queryRaw: jest.fn(),
    modelUsageEvent: {
      findMany: jest.fn(),
    },
  };
  const service = new OverviewService(prisma as never);
  return { service, prisma };
}

describe('OverviewService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resolveMetricsDateRangeMock.mockReturnValue({
      dateFrom: '2026-06-01',
      dateTo: '2026-06-07',
    });
  });

  it('throws BadRequestException when user is missing', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.getOverview({
        userId: USER_ID,
        projectId: PROJECT_ID,
        chartPeriod: 'week',
      }),
    ).rejects.toThrow(new BadRequestException('User not found'));
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when date range is invalid', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue({ analyticsTimezone: 'UTC' });
    resolveMetricsDateRangeMock.mockImplementation(() => {
      throw new Error('dateFrom must be on or before dateTo');
    });

    await expect(
      service.getOverview({
        userId: USER_ID,
        projectId: PROJECT_ID,
        dateFrom: '2026-06-10',
        dateTo: '2026-06-01',
        chartPeriod: 'week',
      }),
    ).rejects.toThrow(
      new BadRequestException(
        'Invalid date range — use YYYY-MM-DD and ensure dateFrom <= dateTo',
      ),
    );
  });

  it('returns metrics, week charts, and recent calls', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue({ analyticsTimezone: 'Asia/Ho_Chi_Minh' });
    prisma.$queryRaw
      .mockResolvedValueOnce([
        { total_input: 100n, total_output: 40n, total_cost: '1.250000' },
      ])
      .mockResolvedValueOnce([
        { day: '2026-06-07', input: 20n, output: 8n },
      ]);
    prisma.modelUsageEvent.findMany.mockResolvedValue([
      {
        modelId: 'gpt-4o',
        providerId: 'openai',
        agentSlug: 'main',
        source: 'CHAT',
        inputTokens: 10,
        outputTokens: 5,
        status: 'SUCCESS',
        latencyMs: 320,
        createdAt: new Date('2026-06-07T10:00:00.000Z'),
      },
    ]);

    const result = await service.getOverview({
      userId: USER_ID,
      projectId: PROJECT_ID,
      chartPeriod: 'week',
    });

    expect(result.timezone).toBe('Asia/Ho_Chi_Minh');
    expect(result.dateFrom).toBe('2026-06-01');
    expect(result.dateTo).toBe('2026-06-07');
    expect(result.chartPeriod).toBe('week');
    expect(result.metrics).toEqual({
      totalInput: 100,
      totalOutput: 40,
      totalCostUsd: '1.250000',
    });
    expect(result.charts.input).toHaveLength(7);
    expect(result.charts.output).toHaveLength(7);
    expect(result.charts.input[6]).toEqual({ date: '2026-06-07', value: 20 });
    expect(result.recentCalls).toEqual([
      expect.objectContaining({
        modelId: 'gpt-4o',
        status: 'Success',
        createdAt: '2026-06-07T10:00:00.000Z',
      }),
    ]);
    expect(prisma.modelUsageEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId: PROJECT_ID },
        take: 20,
      }),
    );
  });

  it('fills 24 hourly buckets for day chart period', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue({ analyticsTimezone: 'UTC' });
    prisma.$queryRaw
      .mockResolvedValueOnce([{ total_input: 0, total_output: 0, total_cost: '0' }])
      .mockResolvedValueOnce([{ hour: 9, input: 15n, output: 3n }]);
    prisma.modelUsageEvent.findMany.mockResolvedValue([]);

    const result = await service.getOverview({
      userId: USER_ID,
      projectId: PROJECT_ID,
      chartPeriod: 'day',
    });

    expect(result.charts.input).toHaveLength(24);
    expect(result.charts.input[9]).toEqual({ hour: 9, value: 15 });
    expect(result.charts.input[0]).toEqual({ hour: 0, value: 0 });
  });

  it('fills each day of the month for month chart period', async () => {
    const { service, prisma } = createService();
    resolveMetricsDateRangeMock.mockReturnValue({
      dateFrom: '2026-06-01',
      dateTo: '2026-06-15',
    });
    prisma.user.findUnique.mockResolvedValue({ analyticsTimezone: 'UTC' });
    prisma.$queryRaw
      .mockResolvedValueOnce([{ total_input: 0, total_output: 0, total_cost: '0' }])
      .mockResolvedValueOnce([{ day: 15, input: 5n, output: 2n }]);
    prisma.modelUsageEvent.findMany.mockResolvedValue([]);

    const result = await service.getOverview({
      userId: USER_ID,
      projectId: PROJECT_ID,
      chartPeriod: 'month',
    });

    expect(result.charts.input).toHaveLength(30);
    expect(result.charts.input[14]).toEqual({ day: 15, value: 5 });
    expect(result.charts.input[0]).toEqual({ day: 1, value: 0 });
  });

  it('maps failed and cancelled usage statuses for recent calls', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue({ analyticsTimezone: 'UTC' });
    prisma.$queryRaw
      .mockResolvedValueOnce([{ total_input: 0, total_output: 0, total_cost: '0' }])
      .mockResolvedValueOnce([]);
    prisma.modelUsageEvent.findMany.mockResolvedValue([
      {
        modelId: 'gemini',
        providerId: 'google',
        agentSlug: null,
        source: 'CHAT',
        inputTokens: 1,
        outputTokens: 0,
        status: 'FAILED',
        latencyMs: null,
        createdAt: new Date('2026-06-07T11:00:00.000Z'),
      },
      {
        modelId: 'gemini',
        providerId: 'google',
        agentSlug: null,
        source: 'CHAT',
        inputTokens: 1,
        outputTokens: 0,
        status: 'CANCELLED',
        latencyMs: null,
        createdAt: new Date('2026-06-07T12:00:00.000Z'),
      },
    ]);

    const result = await service.getOverview({
      userId: USER_ID,
      projectId: PROJECT_ID,
      chartPeriod: 'week',
    });

    expect(result.recentCalls.map((row) => row.status)).toEqual(['Failed', 'Cancelled']);
  });
});
