import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ProjectStatus } from '../../plugins/worker-callbacks/dtos/update-status.dto';
import { ProjectsService } from '../../plugins/projects/projects.service';

const CONTAINER_OPS_QUEUE = 'container-ops';
const MOCK_WORKER_DELAY_MS = 1000;

@Injectable()
export class QueueConsumerService implements OnModuleInit {
  private readonly logger = new Logger(QueueConsumerService.name);
  private mockWorkerEnabled = process.env.NODE_ENV !== 'production';

  constructor(
    private readonly moduleRef: ModuleRef,
    @InjectQueue(CONTAINER_OPS_QUEUE)
    private readonly containerOpsQueue: Queue,
  ) {}

  async onModuleInit() {
    if (!this.mockWorkerEnabled) {
      this.logger.log('Mock worker disabled (production mode)');
      return;
    }

    this.logger.log('Starting mock VPS worker');
    await this.initializeMockWorker();
  }

  private async initializeMockWorker() {
    // Listen for job events
    this.containerOpsQueue.on('global:completed', async (jobId) => {
      this.logger.debug(`Job completed: ${jobId}`);
    });

    this.containerOpsQueue.on('global:failed', async (jobId, err) => {
      this.logger.warn(`Job failed: ${jobId}`, err.message);
    });

    // Named jobs (`spawn`, `wake`, …): single-arg process() only binds `__default__`.
    // Wildcard `*` matches every job name (see bull Queue.prototype.processJob).
    this.containerOpsQueue.process('*', 1, async (job) => {
      await this.handleQueueJob(job);
      return {};
    });
  }

  private projects(): ProjectsService {
    return this.moduleRef.get(ProjectsService, { strict: false });
  }

  private async handleQueueJob(job: any) {
    const { name, data } = job;
    const { projectId, userId } = data;

    this.logger.log(`Processing mock job: ${name} for project ${projectId}`);

    // Simulate processing delay
    await this.delay(MOCK_WORKER_DELAY_MS);

    try {
      switch (name) {
        case 'spawn':
          await this.simulateSpawn(projectId, userId, data);
          break;
        case 'wake':
          await this.simulateWake(projectId, userId);
          break;
        case 'stop':
          await this.simulateStop(projectId, userId);
          break;
        case 'destroy':
          await this.simulateDestroy(projectId, userId);
          break;
        default:
          this.logger.warn(`Unknown job type: ${name}`);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Error processing job ${name}: ${err.message}`, err.stack);
      throw error;
    }
  }

  private async simulateSpawn(projectId: string, userId: string, data: any) {
    this.logger.log(`[Mock] Spawning container for project ${projectId}`);

    const containerId = `mock-${projectId.substring(0, 8)}-${Date.now()}`;

    await this.projects().updateProjectStatus(
      projectId,
      ProjectStatus.RUNNING,
      containerId,
    );
    this.logger.log(
      `[Mock] Project ${projectId} is now RUNNING with container ${containerId}`,
    );
  }

  private async simulateWake(projectId: string, userId: string) {
    this.logger.log(`[Mock] Waking up project ${projectId}`);
    await this.projects().updateProjectStatus(
      projectId,
      ProjectStatus.RUNNING,
    );
    this.logger.log(`[Mock] Project ${projectId} is now RUNNING`);
  }

  private async simulateStop(projectId: string, userId: string) {
    this.logger.log(`[Mock] Stopping project ${projectId}`);
    await this.projects().updateProjectStatus(
      projectId,
      ProjectStatus.STOPPED,
    );
    this.logger.log(`[Mock] Project ${projectId} is now STOPPED`);
  }

  private async simulateDestroy(projectId: string, userId: string) {
    this.logger.log(`[Mock] Destroying project ${projectId}`);
    await this.projects().updateProjectStatus(
      projectId,
      ProjectStatus.DESTROYING,
    );
    this.logger.log(`[Mock] Project ${projectId} marked as DESTROYING`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
