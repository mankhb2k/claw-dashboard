import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import axios from 'axios';
import { ProjectStatus } from '../../plugins/worker-callbacks/dtos/update-status.dto';

const CONTAINER_OPS_QUEUE = 'container-ops';
const MOCK_WORKER_DELAY_MS = 1000;

@Injectable()
export class QueueConsumerService implements OnModuleInit {
  private readonly logger = new Logger(QueueConsumerService.name);
  private mockWorkerEnabled = process.env.NODE_ENV !== 'production';

  constructor(
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

    // Listen for new jobs and process them
    this.containerOpsQueue.process(async (job) => {
      await this.handleQueueJob(job);
      return {};
    });
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
      this.logger.error(`Error processing job ${name}:`, error);
      throw error;
    }
  }

  private async simulateSpawn(projectId: string, userId: string, data: any) {
    this.logger.log(`[Mock] Spawning container for project ${projectId}`);

    // Simulate container creation
    const containerId = `mock-${projectId.substring(0, 8)}-${Date.now()}`;

    // Call internal API to update status
    await this.updateProjectStatus(
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
    await this.updateProjectStatus(projectId, ProjectStatus.RUNNING);
    this.logger.log(`[Mock] Project ${projectId} is now RUNNING`);
  }

  private async simulateStop(projectId: string, userId: string) {
    this.logger.log(`[Mock] Stopping project ${projectId}`);
    await this.updateProjectStatus(projectId, ProjectStatus.STOPPED);
    this.logger.log(`[Mock] Project ${projectId} is now STOPPED`);
  }

  private async simulateDestroy(projectId: string, userId: string) {
    this.logger.log(`[Mock] Destroying project ${projectId}`);
    await this.updateProjectStatus(projectId, ProjectStatus.DESTROYING);
    this.logger.log(`[Mock] Project ${projectId} marked as DESTROYING`);
  }

  private async updateProjectStatus(
    projectId: string,
    status: ProjectStatus,
    containerId?: string,
    errorMessage?: string,
  ) {
    const internalApiUrl = `http://localhost:${process.env.PORT ?? 3001}/api/internal/status`;
    const workerSecret = process.env.VPS_WORKER_SECRET || 'mock-secret';

    try {
      const response = await axios.post(
        internalApiUrl,
        {
          projectId,
          status,
          containerId,
          ...(errorMessage ? { errorMessage } : {}),
        },
        {
          headers: {
            Authorization: `Bearer ${workerSecret}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        },
      );

      this.logger.debug(
        `Status update response for ${projectId}:`,
        response.status,
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to update project status for ${projectId}`,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
