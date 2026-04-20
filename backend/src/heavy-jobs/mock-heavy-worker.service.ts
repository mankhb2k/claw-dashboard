import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { HeavyJobsService } from './heavy-jobs.service';

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
      return; // Don't mock in production or if queue unavailable
    }

    try {
      this.logger.log('Starting mock heavy worker');

      // Process all heavy job types
      await this.heavyTasksQueue.process('ffmpeg', async (job) => {
        return this.processHeavyJob(job, 'ffmpeg', 3000);
      });

      await this.heavyTasksQueue.process('playwright', async (job) => {
        return this.processHeavyJob(job, 'playwright', 1500);
      });

      await this.heavyTasksQueue.process('tts', async (job) => {
        return this.processHeavyJob(job, 'tts', 1000);
      });

      await this.heavyTasksQueue.process('stt', async (job) => {
        return this.processHeavyJob(job, 'stt', 2000);
      });

      // Listen to job completion
      this.heavyTasksQueue.on('completed', (job) => {
        this.logger.log(`Job ${job.id} completed: ${job.data.jobId}`);
      });

      this.heavyTasksQueue.on('failed', (job, error) => {
        this.logger.error(
          `Job ${job.id} failed: ${error.message}`,
        );
      });

      this.logger.log('Mock heavy worker initialized successfully');
    } catch (error) {
      this.logger.warn(
        `Failed to initialize mock heavy worker: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async processHeavyJob(job: any, tool: string, delayMs: number) {
    const { jobId, userId, params } = job.data;

    this.logger.log(`[${tool}] Processing job ${jobId}`);

    try {
      // Simulate processing time
      await this.delay(delayMs);

      // Generate mock result
      const resultPath = `/data/users/${userId}/heavy-tasks/${jobId}.result`;
      const resultSizeMb = Math.random() * 50 + 1; // 1-50 MB

      this.logger.log(`[${tool}] Job ${jobId} completed: ${resultPath}`);

      // Update job in database
      await this.heavyJobsService.updateJobResult(
        jobId,
        'DONE',
        resultPath,
        Math.round(resultSizeMb),
      );

      return { success: true, resultPath };
    } catch (error) {
      this.logger.error(
        `[${tool}] Job ${jobId} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      // Update job with error
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
