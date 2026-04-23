import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { HeavyJobsService } from './heavy-jobs.service';
import { TOOL_REGISTRY } from './tool-registry';

@Injectable()
export class MockHeavyWorkerService {
  private readonly logger = new Logger(MockHeavyWorkerService.name);

  constructor(
    @InjectQueue('heavy-tasks')
    private heavyTasksQueue: Queue,
    private heavyJobsService: HeavyJobsService,
  ) {}

  async initializeMockWorker() {
    if (process.env.NODE_ENV === 'production' || !this.heavyTasksQueue) {
      return;
    }

    try {
      this.logger.log('Starting mock heavy worker');

      // Register a handler per tool dynamically — adding a new tool to TOOL_REGISTRY
      // automatically gets a mock handler here, no code changes needed.
      for (const [tool, config] of Object.entries(TOOL_REGISTRY)) {
        const jobName = tool.toLowerCase();
        this.heavyTasksQueue.process(jobName, async (job) => {
          return this.processHeavyJob(job, tool, config.mockDelayMs);
        });
      }

      this.heavyTasksQueue.on('completed', (job) => {
        this.logger.log(`Job ${job.id} completed: ${job.data.jobId}`);
      });

      this.heavyTasksQueue.on('failed', (job, error) => {
        this.logger.error(`Job ${job.id} failed: ${error.message}`);
      });

      this.logger.log(
        `Mock heavy worker initialized for tools: ${Object.keys(TOOL_REGISTRY).join(', ')}`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to initialize mock heavy worker: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private async processHeavyJob(job: any, tool: string, delayMs: number) {
    const { jobId, userId } = job.data;

    this.logger.log(`[${tool}] Processing job ${jobId}`);

    try {
      await this.delay(delayMs);

      const resultPath = `/data/users/${userId}/heavy-tasks/${jobId}.result`;
      const resultSizeMb = Math.round(Math.random() * 50 + 1); // 1-50 MB

      this.logger.log(`[${tool}] Job ${jobId} completed: ${resultPath}`);

      await this.heavyJobsService.updateJobResult(jobId, 'DONE', resultPath, resultSizeMb);

      return { success: true, resultPath };
    } catch (error) {
      this.logger.error(
        `[${tool}] Job ${jobId} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      await this.heavyJobsService.updateJobResult(
        jobId,
        'FAILED',
        undefined,
        undefined,
        error instanceof Error ? error.message : 'Unknown error',
      );

      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
