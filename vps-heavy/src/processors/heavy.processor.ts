import { Queue, Job, Worker } from 'bull';
import { FFmpegTool } from '../tools/ffmpeg.tool.ts';
import { PlaywrightTool } from '../tools/playwright.tool.ts';
import { TTSTool } from '../tools/tts.tool.ts';
import { STTTool } from '../tools/stt.tool.ts';
import { StorageService } from '../storage/storage.service.ts';
import { CallbackService } from '../control-plane/callback.service.ts';
import { Logger } from '../logger.ts';
import * as fs from 'fs/promises';

const logger = new Logger('HeavyProcessor');

const TIMEOUTS = {
  ffmpeg: parseInt(process.env.FFMPEG_TIMEOUT || '300') * 1000, // 5 min
  playwright: parseInt(process.env.PLAYWRIGHT_TIMEOUT || '120') * 1000, // 2 min
  tts: 120 * 1000, // 2 min
  stt: 300 * 1000, // 5 min
};

interface HeavyJobData {
  jobId: string;
  userId: string;
  projectId?: string;
  tool: 'ffmpeg' | 'playwright' | 'tts' | 'stt';
  params: Record<string, any>;
}

export class HeavyProcessor {
  private ffmpegTool = new FFmpegTool();
  private playwrightTool = new PlaywrightTool();
  private ttsTool = new TTSTool();
  private sttTool = new STTTool();
  private storage = new StorageService();
  private callback = new CallbackService();
  private worker: Worker<any> | null = null;

  constructor(private queue: Queue) {}

  async start(): Promise<void> {
    const concurrency = parseInt(process.env.CONCURRENT_JOBS || '3');

    this.worker = new Worker<any>('heavy-tasks', this.processJob.bind(this), {
      concurrency,
      connection: this.queue.client.options as any,
    });

    this.worker.on('completed', (job) => {
      logger.log(`Job completed: ${job.name} - ${job.data.jobId}`);
    });

    this.worker.on('failed', (job, err) => {
      logger.error(`Job failed: ${job?.name} - ${job?.data.jobId}: ${err.message}`);
    });

    logger.log(`Heavy processor started (concurrency: ${concurrency})`);
  }

  async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
    await this.ffmpegTool.closeBrowser();
    logger.log('Heavy processor stopped');
  }

  private async processJob(job: Job<HeavyJobData>): Promise<void> {
    const { jobId, userId, tool, params } = job.data;
    const deadline = Date.now() + TIMEOUTS[tool];

    logger.log(`Processing heavy job`, { jobId, userId, tool });

    try {
      // Notify backend that job is processing
      await this.callback.notifyJobStart(jobId);

      // Process based on tool type
      let outputPath: string;
      let format: string;
      let mimeType: string;

      switch (tool) {
        case 'ffmpeg': {
          if (!params.inputPath && !params.inputUrl) {
            throw new Error('FFmpeg requires inputPath or inputUrl');
          }

          let inputPath = params.inputPath;
          if (params.inputUrl) {
            // Download from URL (simplified - would use axios in real implementation)
            logger.log(`FFmpeg would download from ${params.inputUrl}`);
          }

          const result = await this.ffmpegTool.process(inputPath, params, deadline);
          const buffer = await fs.readFile(result.outputPath);
          const saved = await this.storage.saveResult(userId, jobId, buffer, result.format, result.mimeType);

          await this.callback.updateJobResult({
            jobId,
            status: 'DONE',
            resultPath: saved.filePath,
            size: saved.size,
            checksum: saved.checksum,
          });

          await fs.unlink(result.outputPath);
          break;
        }

        case 'playwright': {
          if (!params.url && !params.html) {
            throw new Error('Playwright requires url or html');
          }

          const result = await this.playwrightTool.capture(params, deadline);
          const buffer = await fs.readFile(result.outputPath);
          const saved = await this.storage.saveResult(userId, jobId, buffer, result.format, result.mimeType);

          await this.callback.updateJobResult({
            jobId,
            status: 'DONE',
            resultPath: saved.filePath,
            size: saved.size,
            checksum: saved.checksum,
          });

          await fs.unlink(result.outputPath);
          break;
        }

        case 'tts': {
          if (!params.text) {
            throw new Error('TTS requires text parameter');
          }

          const result = await this.ttsTool.synthesize(params, deadline);
          const buffer = await fs.readFile(result.outputPath);
          const saved = await this.storage.saveResult(userId, jobId, buffer, result.format, result.mimeType);

          await this.callback.updateJobResult({
            jobId,
            status: 'DONE',
            resultPath: saved.filePath,
            size: saved.size,
            checksum: saved.checksum,
          });

          await fs.unlink(result.outputPath);
          break;
        }

        case 'stt': {
          if (!params.audioPath && !params.audioUrl) {
            throw new Error('STT requires audioPath or audioUrl');
          }

          let audioPath = params.audioPath;
          if (params.audioUrl) {
            // Download from URL
            logger.log(`STT would download from ${params.audioUrl}`);
          }

          const result = await this.sttTool.transcribe(audioPath, params, deadline);

          // Save transcript as text file
          const transcriptBuffer = Buffer.from(result.transcript, 'utf-8');
          const saved = await this.storage.saveResult(userId, jobId, transcriptBuffer, 'txt', 'text/plain');

          await this.callback.updateJobResult({
            jobId,
            status: 'DONE',
            resultPath: saved.filePath,
            size: saved.size,
            checksum: saved.checksum,
          });

          break;
        }

        default:
          throw new Error(`Unknown tool: ${tool}`);
      }

      logger.log(`Job completed successfully: ${jobId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`Job failed: ${jobId}`, err);

      try {
        await this.callback.updateJobResult({
          jobId,
          status: 'FAILED',
          errorMessage,
        });
      } catch (callbackErr) {
        logger.error(`Failed to notify backend of job failure: ${jobId}`, callbackErr);
      }

      throw err;
    }
  }
}
