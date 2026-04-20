import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';

type HeavyTool = 'FFMPEG' | 'PLAYWRIGHT' | 'TTS' | 'STT';

@Injectable()
export class HeavyJobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
  ) {}

  async submitJob(
    userId: string,
    projectId: string,
    tool: HeavyTool,
    params: Record<string, any>,
  ) {
    // Verify project ownership
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { user: { include: { subscription: { include: { plan: true } } } } },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('Not your project');
    }

    // Get user subscription plan
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    const plan = subscription?.plan || (await this.getFreePlan());

    if (!plan) {
      throw new BadRequestException('Plan not configured');
    }

    // Check if user is on Pro plan (heavy jobs only for Pro)
    if (plan.name !== 'pro') {
      throw new ForbiddenException(
        'Heavy jobs only available on Pro plan. Upgrade to access FFmpeg, Playwright, TTS/STT.',
      );
    }

    // Check daily quota
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const jobsToday = await this.prisma.heavyJob.count({
      where: {
        userId,
        status: { in: ['PROCESSING', 'DONE'] },
        submittedAt: { gte: today },
      },
    });

    if (jobsToday >= plan.heavyJobsPerDay) {
      throw new ConflictException(
        `Daily heavy job limit (${plan.heavyJobsPerDay}) reached`,
      );
    }

    // Create job
    const job = await this.prisma.heavyJob.create({
      data: {
        userId,
        projectId,
        tool: tool as any,
        params,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Enqueue to heavy queue based on tool
    const timeout = this.getToolTimeout(tool);
    await this.queue.enqueueHeavyJob(tool, {
      jobId: job.id,
      userId,
      projectId,
      params,
      timeout,
    });

    return {
      jobId: job.id,
      status: job.status,
      submittedAt: job.submittedAt,
      estimatedWait: this.getEstimatedWait(tool),
    };
  }

  async getJobStatus(jobId: string, userId: string) {
    const job = await this.prisma.heavyJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.userId !== userId) {
      throw new ForbiddenException('Not your job');
    }

    return {
      jobId: job.id,
      status: job.status,
      submittedAt: job.submittedAt,
      completedAt: job.completedAt,
      resultPath: job.resultPath,
      resultSizeMb: job.resultSizeMb,
      errorMessage: job.errorMessage,
    };
  }

  async cancelJob(jobId: string, userId: string) {
    const job = await this.prisma.heavyJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.userId !== userId) {
      throw new ForbiddenException('Not your job');
    }

    if (!['PENDING', 'PROCESSING'].includes(job.status)) {
      throw new ConflictException(`Cannot cancel job in status: ${job.status}`);
    }

    await this.prisma.heavyJob.update({
      where: { id: jobId },
      data: { status: 'CANCELLED' },
    });

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
      status: job.status,
      submittedAt: job.submittedAt,
      completedAt: job.completedAt,
      resultSizeMb: job.resultSizeMb,
    }));
  }

  async getJobResult(jobId: string, userId: string) {
    const job = await this.prisma.heavyJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.userId !== userId) {
      throw new ForbiddenException('Not your job');
    }

    if (job.status !== 'DONE') {
      throw new BadRequestException(
        `Job not ready. Status: ${job.status}`,
      );
    }

    return {
      jobId: job.id,
      resultPath: job.resultPath,
      resultSizeMb: job.resultSizeMb,
      completedAt: job.completedAt,
    };
  }

  // Internal: Called by mock heavy worker to update job result
  async updateJobResult(
    jobId: string,
    status: 'DONE' | 'FAILED',
    resultPath?: string,
    resultSizeMb?: number,
    errorMessage?: string,
  ) {
    const job = await this.prisma.heavyJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

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
  }

  // ── Private Helpers ──

  private getFreePlan() {
    return this.prisma.plan.findUnique({
      where: { name: 'free' },
    });
  }

  private getToolTimeout(tool: HeavyTool): number {
    const timeouts: Record<HeavyTool, number> = {
      FFMPEG: 300000, // 5 minutes
      PLAYWRIGHT: 120000, // 2 minutes
      TTS: 120000, // 2 minutes
      STT: 300000, // 5 minutes
    };
    return timeouts[tool];
  }

  private getEstimatedWait(tool: HeavyTool): string {
    const waits: Record<HeavyTool, string> = {
      FFMPEG: '2-5 minutes',
      PLAYWRIGHT: '30-60 seconds',
      TTS: '10-30 seconds',
      STT: '1-2 minutes',
    };
    return waits[tool];
  }
}
