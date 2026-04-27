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

      const registered = new Set<string>();
      // Register one handler per queue job name. FFMPEG variants share `ffmpeg` queue name.
      for (const tool of Object.keys(TOOL_REGISTRY)) {
        const jobName = tool.startsWith('FFMPEG') ? 'ffmpeg' : tool.toLowerCase();
        if (registered.has(jobName)) continue;
        registered.add(jobName);
        this.heavyTasksQueue.process(jobName, async (job) => {
          const runtimeTool = String(job.data.tool ?? tool).toUpperCase();
          const runtimeCfg = TOOL_REGISTRY[runtimeTool] ?? TOOL_REGISTRY[tool];
          return this.processHeavyJob(job, runtimeTool, runtimeCfg.mockDelayMs);
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
