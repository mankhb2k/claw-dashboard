import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GatewayRpcService } from '../../../gateway/services/gateway-rpc/gateway-rpc.service';
import { parseCronRunRpcUsage } from '../../../usage/lib/parse-rpc-usage';
import { ModelUsageRecorderService } from '../../../usage/services/model-usage-recorder/model-usage-recorder.service';
import type { CreateCronJobDto, UpdateCronJobDto } from '../../dto/cron.dto';

/** Gateway cron.list rejects limit > 200 */
const CRON_LIST_PAGE_SIZE = 200;

/** Align with billing-plan.md — enforce in API until PlanGuard exists. */
const CRON_JOBS_PER_PROJECT_LIMIT =
  Number(process.env.CRON_JOBS_PER_PROJECT_LIMIT ?? 20) || 20;

type CronSchedule =
  | { kind: 'at'; at: string }
  | { kind: 'every'; everyMs: number }
  | { kind: 'cron'; expr: string };

type CronJobRecord = {
  id: string;
  name: string;
  agentId?: string;
  enabled: boolean;
  schedule: CronSchedule;
  payload: { kind: string; message?: string; text?: string };
  state?: {
    nextRunAtMs?: number;
    lastRunAtMs?: number;
    lastRunStatus?: string;
    lastStatus?: string;
    lastError?: string;
  };
};

type CronListPage = {
  jobs: CronJobRecord[];
  total: number;
  limit?: number;
  offset?: number;
};

type CronStatus = {
  enabled?: boolean;
  jobCount?: number;
};

function isFailedJob(job: CronJobRecord): boolean {
  const status = job.state?.lastRunStatus ?? job.state?.lastStatus;
  return status === 'error' || status === 'failed';
}

function buildSchedule(dto: {
  scheduleKind: 'cron' | 'every' | 'at';
  cronExpr?: string;
  everyMinutes?: number;
  at?: string;
}): CronSchedule {
  if (dto.scheduleKind === 'cron') {
    const expr = dto.cronExpr?.trim();
    if (!expr) {
      throw new BadRequestException('cronExpr is required for cron schedule');
    }
    return { kind: 'cron', expr };
  }
  if (dto.scheduleKind === 'every') {
    const minutes = dto.everyMinutes ?? 60;
    return { kind: 'every', everyMs: minutes * 60_000 };
  }
  const at = dto.at?.trim();
  if (!at) {
    throw new BadRequestException('at is required for one-shot schedule');
  }
  return { kind: 'at', at };
}

function buildAgentTurnCreate(params: {
  name: string;
  agentId: string;
  message: string;
  enabled: boolean;
  schedule: CronSchedule;
}) {
  return {
    name: params.name,
    agentId: params.agentId,
    enabled: params.enabled,
    schedule: params.schedule,
    sessionTarget: 'isolated' as const,
    wakeMode: 'now' as const,
    payload: {
      kind: 'agentTurn' as const,
      message: params.message,
    },
  };
}

@Injectable()
export class CronService {
  constructor(
    private readonly gateway: GatewayRpcService,
    private readonly usageRecorder: ModelUsageRecorderService,
  ) {}

  async getSummary(userId: string, projectId: string) {
    const [status, page] = await Promise.all([
      this.gateway.call<CronStatus>(userId, projectId, 'cron.status', {}),
      this.gateway.call<CronListPage>(userId, projectId, 'cron.list', {
        includeDisabled: true,
        limit: CRON_LIST_PAGE_SIZE,
        offset: 0,
      }),
    ]);

    const total = page.total ?? page.jobs.length;
    const failedJobs = page.jobs.filter(isFailedJob);
    return {
      enabled: status.enabled ?? true,
      jobCount: status.jobCount ?? total,
      total,
      limit: CRON_JOBS_PER_PROJECT_LIMIT,
      remaining: Math.max(0, CRON_JOBS_PER_PROJECT_LIMIT - total),
      failedCount: failedJobs.length,
      recentFailures: failedJobs.slice(0, 5).map((job) => ({
        id: job.id,
        name: job.name,
        agentId: job.agentId,
      })),
    };
  }

  async list(
    userId: string,
    projectId: string,
    agentId?: string,
  ): Promise<CronListPage> {
    return this.gateway.call<CronListPage>(userId, projectId, 'cron.list', {
      includeDisabled: true,
      limit: CRON_LIST_PAGE_SIZE,
      offset: 0,
      sortBy: 'nextRunAtMs',
      sortDir: 'asc',
      ...(agentId?.trim() ? { agentId: agentId.trim() } : {}),
    });
  }

  async get(userId: string, projectId: string, jobId: string): Promise<CronJobRecord> {
    const job = await this.gateway.call<CronJobRecord | null>(
      userId,
      projectId,
      'cron.get',
      { id: jobId },
    );
    if (!job) {
      throw new NotFoundException('Cron job not found');
    }
    return job;
  }

  async create(userId: string, projectId: string, dto: CreateCronJobDto) {
    const page = await this.gateway.call<CronListPage>(userId, projectId, 'cron.list', {
      includeDisabled: true,
      limit: 1,
      offset: 0,
    });
    const total = page.total ?? 0;
    if (total >= CRON_JOBS_PER_PROJECT_LIMIT) {
      throw new BadRequestException(
        `Cron job limit reached (${CRON_JOBS_PER_PROJECT_LIMIT} per project)`,
      );
    }

    const schedule = buildSchedule(dto);
    const body = buildAgentTurnCreate({
      name: dto.name.trim(),
      agentId: dto.agentId.trim(),
      message: dto.message.trim(),
      enabled: dto.enabled ?? true,
      schedule,
    });

    return this.gateway.call<CronJobRecord>(userId, projectId, 'cron.add', body);
  }

  async update(
    userId: string,
    projectId: string,
    jobId: string,
    dto: UpdateCronJobDto,
  ) {
    const current = await this.get(userId, projectId, jobId);
    const patch: Record<string, unknown> = {};

    if (dto.name !== undefined) {
      patch.name = dto.name.trim();
    }
    if (dto.enabled !== undefined) {
      patch.enabled = dto.enabled;
    }
    if (
      dto.scheduleKind !== undefined ||
      dto.cronExpr !== undefined ||
      dto.everyMinutes !== undefined ||
      dto.at !== undefined
    ) {
      const kind = dto.scheduleKind ?? current.schedule.kind;
      patch.schedule = buildSchedule({
        scheduleKind: kind,
        cronExpr: dto.cronExpr ?? (current.schedule.kind === 'cron' ? current.schedule.expr : undefined),
        everyMinutes:
          dto.everyMinutes ??
          (current.schedule.kind === 'every'
            ? Math.round(current.schedule.everyMs / 60_000)
            : undefined),
        at: dto.at ?? (current.schedule.kind === 'at' ? current.schedule.at : undefined),
      });
    }
    if (dto.message !== undefined) {
      patch.payload = {
        kind: 'agentTurn',
        message: dto.message.trim(),
      };
    }

    return this.gateway.call<CronJobRecord>(userId, projectId, 'cron.update', {
      id: jobId,
      patch,
    });
  }

  async remove(userId: string, projectId: string, jobId: string) {
    return this.gateway.call<{ removed: boolean }>(userId, projectId, 'cron.remove', {
      id: jobId,
    });
  }

  async run(userId: string, projectId: string, jobId: string) {
    const result = await this.gateway.call<unknown>(userId, projectId, 'cron.run', {
      id: jobId,
      mode: 'force',
    });

    const parsed = parseCronRunRpcUsage(jobId, result);
    if (parsed) {
      this.usageRecorder.recordFireAndForget({
        projectId,
        userId,
        ...parsed,
      });
    }

    return result;
  }
}
