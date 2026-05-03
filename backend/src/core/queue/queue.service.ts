import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('container-ops')
    private containerOpsQueue: Queue,
    @InjectQueue('heavy-tasks')
    private heavyTasksQueue: Queue,
  ) {}

  // ─── Container Operations Queue ────────────────────────────────────────

  async enqueueSpawn(
    projectId: string,
    userId: string,
    subdomain: string,
    imageVersion: string,
    cpuLimit: number,
    ramLimit: number,
    idleTimeoutMin: number,
    plan: 'free' | 'pro',
    dockerEnv: Record<string, string>,
  ): Promise<void> {
    await this.containerOpsQueue.add(
      'spawn',
      {
        projectId,
        userId,
        subdomain,
        imageVersion,
        cpuLimit,
        ramLimit,
        idleTimeoutMin,
        plan,
        dockerEnv,
      },
      {
        priority: 5,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        // Must cover gateway cold-start budget in vps-worker waitHealthy().
        timeout: 360_000, // 6 minutes
      },
    );
  }

  async enqueueWake(
    projectId: string,
    userId: string,
    subdomain: string,
  ): Promise<void> {
    await this.containerOpsQueue.add(
      'wake',
      { projectId, userId, subdomain },
      {
        priority: 1, // Highest priority
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        // Phải >= thời gian waitHealthy ở vps-worker (gateway cold-start có thể vài phút)
        timeout: 360_000, // 6 minutes
      },
    );
  }

  async enqueueStop(
    projectId: string,
    userId: string,
    subdomain: string,
  ): Promise<void> {
    await this.containerOpsQueue.add(
      'stop',
      { projectId, userId, subdomain },
      {
        priority: 10, // Lowest priority
        attempts: 1,
        timeout: 60000, // 1 minute
      },
    );
  }

  async enqueueDestroy(
    projectId: string,
    userId: string,
    subdomain: string,
  ): Promise<void> {
    await this.containerOpsQueue.add(
      'destroy',
      { projectId, userId, subdomain },
      {
        priority: 5,
        attempts: 0, // No retries (prevent accidental double-delete)
        timeout: 120000, // 2 minutes
      },
    );
  }

  // ─── Heavy Tasks Queue ─────────────────────────────────────────────────

  async enqueueFFmpeg(
    userId: string,
    projectId: string,
    params: Record<string, any>,
  ): Promise<string> {
    const job = await this.heavyTasksQueue.add(
      'ffmpeg',
      { userId, projectId, params },
      {
        attempts: 1,
        timeout: 300000, // 5 minutes
      },
    );
    return job.id.toString();
  }

  async enqueuePlaywright(
    userId: string,
    projectId: string,
    params: Record<string, any>,
  ): Promise<string> {
    const job = await this.heavyTasksQueue.add(
      'playwright',
      { userId, projectId, params },
      {
        attempts: 1,
        timeout: 120000, // 2 minutes
      },
    );
    return job.id.toString();
  }

  async enqueueTTS(
    userId: string,
    projectId: string,
    params: Record<string, any>,
  ): Promise<string> {
    const job = await this.heavyTasksQueue.add(
      'tts',
      { userId, projectId, params },
      {
        attempts: 1,
        timeout: 120000, // 2 minutes
      },
    );
    return job.id.toString();
  }

  async enqueueSTT(
    userId: string,
    projectId: string,
    params: Record<string, any>,
  ): Promise<string> {
    const job = await this.heavyTasksQueue.add(
      'stt',
      { userId, projectId, params },
      {
        attempts: 1,
        timeout: 300000, // 5 minutes
      },
    );
    return job.id.toString();
  }

  // ─── Queue Info ───────────────────────────────────────────────────────

  async getContainerOpsQueueStats() {
    const count = await this.containerOpsQueue.count();
    const delayed = await this.containerOpsQueue.getDelayedCount();
    const active = await this.containerOpsQueue.getActiveCount();
    const failed = await this.containerOpsQueue.getFailedCount();

    return {
      total: count,
      delayed,
      active,
      failed,
    };
  }

  async getHeavyTasksQueueStats() {
    const count = await this.heavyTasksQueue.count();
    const delayed = await this.heavyTasksQueue.getDelayedCount();
    const active = await this.heavyTasksQueue.getActiveCount();
    const failed = await this.heavyTasksQueue.getFailedCount();

    return {
      total: count,
      delayed,
      active,
      failed,
    };
  }

  async enqueueHeavyJob(
    tool: string,
    data: Record<string, any>,
  ): Promise<string> {
    const job = await this.heavyTasksQueue.add(
      tool.toLowerCase(),
      data,
      {
        attempts: 1,
        timeout: data.timeout || 300000, // Default 5 minutes
      },
    );
    return job.id.toString();
  }
}
