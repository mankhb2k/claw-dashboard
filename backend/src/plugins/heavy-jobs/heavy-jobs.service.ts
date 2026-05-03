import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HeavyTool } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { QueueService } from '../../core/queue/queue.service';
import { CreditService } from '../../core/billing/credit.service';
import { PlanGateService } from '../../core/billing/plan-gate.service';
import {
  AppEvents,
  HeavyJobCancelledEvent,
  HeavyJobSubmittedEvent,
} from '../../core/common/events/app-events';
import { getToolConfig } from './tool-registry';

@Injectable()
export class HeavyJobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly creditService: CreditService,
    private readonly planGate: PlanGateService,
    private readonly events: EventEmitter2,
  ) {}

  async submitJob(
    userId: string,
    projectId: string,
    tool: HeavyTool,
    params: Record<string, any>,
  ) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.userId !== userId) throw new ForbiddenException('Not your project');

    const normalizedTool = tool.toUpperCase() as HeavyTool;
    const toolConfig = getToolConfig(normalizedTool);
    const queueTool = normalizedTool.startsWith('FFMPEG') ? 'ffmpeg' : normalizedTool.toLowerCase();

    const plan = await this.planGate.getPlanForUser(userId);
    if (plan.name !== 'pro') {
      throw new ForbiddenException('Heavy jobs require Pro plan.');
    }

    const job = await this.prisma.heavyJob.create({
      data: {
        userId,
        projectId,
        tool: normalizedTool,
        creditCost: toolConfig.creditCost,
        params,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    await this.creditService.consumeForHeavyJob(
      userId,
      normalizedTool,
      job.id,
      `${normalizedTool} job`,
    );

    await this.queue.enqueueHeavyJob(queueTool, {
      jobId: job.id,
      userId,
      projectId,
      tool: normalizedTool,
      params,
      timeout: toolConfig.timeout,
    });

    this.events.emit(AppEvents.HEAVY_JOB_SUBMITTED, {
      jobId: job.id,
      userId,
      projectId,
      tool: normalizedTool,
    } satisfies HeavyJobSubmittedEvent);

    return {
      jobId: job.id,
      status: job.status,
      creditCost: job.creditCost,
      submittedAt: job.submittedAt,
      estimatedWait: toolConfig.estimatedWait,
    };
  }

  async getJobStatus(jobId: string, userId: string) {
    const job = await this.findOwnedJob(jobId, userId);

    return {
      jobId: job.id,
      status: job.status,
      submittedAt: job.submittedAt,
      completedAt: job.completedAt,
      resultPath: job.resultPath,
      resultSizeMb: job.resultSizeMb,
      creditCost: job.creditCost,
      errorMessage: job.errorMessage,
    };
  }

  async cancelJob(jobId: string, userId: string) {
    const job = await this.findOwnedJob(jobId, userId);

    if (!['PENDING', 'PROCESSING'].includes(job.status)) {
      throw new ConflictException(`Cannot cancel job in status: ${job.status}`);
    }

    await this.prisma.heavyJob.update({
      where: { id: jobId },
      data: { status: 'CANCELLED' },
    });
    await this.creditService.refundForHeavyJob(
      userId,
      jobId,
      job.creditCost,
      'Cancelled heavy job',
    );

    this.events.emit(AppEvents.HEAVY_JOB_CANCELLED, {
      jobId,
      userId,
    } satisfies HeavyJobCancelledEvent);

    return { jobId, status: 'CANCELLED' };
  }

  async listJobs(userId: string, projectId?: string) {
    const jobs = await this.prisma.heavyJob.findMany({
      where: {
        userId,
        ...(projectId && { projectId }),
      },
      orderBy: { submittedAt: 'desc' },
      take: 50,
    });

    return jobs.map((job) => ({
      jobId: job.id,
      tool: job.tool,
      creditCost: job.creditCost,
      status: job.status,
      submittedAt: job.submittedAt,
      completedAt: job.completedAt,
      resultSizeMb: job.resultSizeMb,
    }));
  }

  async getJobResult(jobId: string, userId: string) {
    const job = await this.findOwnedJob(jobId, userId);

    if (job.status !== 'DONE') {
      throw new BadRequestException(`Job not ready. Status: ${job.status}`);
    }

    return {
      jobId: job.id,
      resultPath: job.resultPath,
      resultSizeMb: job.resultSizeMb,
      completedAt: job.completedAt,
    };
  }

  // Internal: called by mock heavy worker to update job result
  async updateJobResult(
    jobId: string,
    status: 'DONE' | 'FAILED',
    resultPath?: string,
    resultSizeMb?: number,
    errorMessage?: string,
  ) {
    const job = await this.prisma.heavyJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');

    await this.prisma.heavyJob.update({
      where: { id: jobId },
      data: {
        status: status as any,
        resultPath,
        resultSizeMb,
        errorMessage,
        completedAt: new Date(),
      },
    });
    if (status === 'FAILED') {
      await this.creditService.refundForHeavyJob(
        job.userId,
        job.id,
        job.creditCost,
        'Heavy job failed (server-side refund)',
      );
    }
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private async findOwnedJob(jobId: string, userId: string) {
    const job = await this.prisma.heavyJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.userId !== userId) throw new ForbiddenException('Not your job');
    return job;
  }
}
