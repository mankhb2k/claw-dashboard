import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger } from '../logger.ts';

const logger = new Logger('FFmpegTool');

export interface FFmpegParams {
  inputUrl?: string; // URL to download from (for async jobs)
  inputPath?: string; // Local path to input file
  format?: 'mp4' | 'webm' | 'avi' | 'mkv' | 'wav' | 'mp3'; // Output format
  quality?: 'low' | 'medium' | 'high'; // Quality preset
  preset?: string; // FFmpeg preset (ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow)
  codec?: string; // Video codec (libx264, libx265, libvpx, etc.)
  bitrate?: string; // Bitrate (e.g., "5000k")
  width?: number; // Output width (maintains aspect ratio if height not set)
  height?: number; // Output height
}

interface FFmpegResult {
  outputPath: string;
  duration: number; // seconds
  format: string; // file extension
  mimeType: string;
}

export class FFmpegTool {
  async process(inputPath: string, params: FFmpegParams, deadline: number): Promise<FFmpegResult> {
    const format = params.format || 'mp4';
    const outputPath = `/tmp/openclaw_ffmpeg_${Date.now()}.${format}`;

    const qualityPresets = {
      low: { preset: 'ultrafast', crf: 28, bitrate: '2000k' },
      medium: { preset: 'medium', crf: 23, bitrate: '5000k' },
      high: { preset: 'slow', crf: 20, bitrate: '10000k' },
    };

    const quality = qualityPresets[params.quality || 'medium'];
    const timeoutMs = deadline - Date.now();

    if (timeoutMs <= 0) {
      throw new Error('Job deadline exceeded before processing');
    }

    return new Promise((resolve, reject) => {
      const cmd = ffmpeg(inputPath);

      // Set output options based on format
      switch (format) {
        case 'mp4':
          cmd
            .videoCodec(params.codec || 'libx264')
            .videoBitrate(params.bitrate || quality.bitrate)
            .preset(params.preset || quality.preset)
            .format('mp4');
          break;
        case 'webm':
          cmd
            .videoCodec('libvpx')
            .videoBitrate(params.bitrate || quality.bitrate)
            .audioCodec('libopus')
            .format('webm');
          break;
        case 'wav':
        case 'mp3':
          cmd
            .audioCodec(format === 'wav' ? 'pcm_s16le' : 'libmp3lame')
            .audioBitrate('192k')
            .format(format);
          break;
        default:
          cmd.format(format);
      }

      // Add dimension constraints if specified
      if (params.width || params.height) {
        const filter = `scale=${params.width || -1}:${params.height || -1}`;
        cmd.videoFilter(filter);
      }

      // Set timeout
      const timer = setTimeout(() => {
        cmd.kill('SIGKILL');
        reject(new Error(`FFmpeg processing timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      cmd
        .output(outputPath)
        .on('start', (commandLine) => {
          logger.log('FFmpeg command started', { inputPath, format });
        })
        .on('progress', (progress) => {
          logger.debug('FFmpeg progress', {
            frame: progress.frames,
            currentFps: progress.currentFps,
            currentKbps: progress.currentKbps,
          });
        })
        .on('end', async () => {
          clearTimeout(timer);
          try {
            const stat = await fs.stat(outputPath);
            logger.log('FFmpeg conversion complete', { outputPath, size: stat.size });
            resolve({
              outputPath,
              duration: 0, // Would need to probe the file
              format,
              mimeType: this.getMimeType(format),
            });
          } catch (err) {
            reject(new Error(`Failed to stat output file: ${err}`));
          }
        })
        .on('error', (err) => {
          clearTimeout(timer);
          logger.error('FFmpeg error:', err);
          reject(err);
        })
        .run();
    });
  }

  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      avi: 'video/x-msvideo',
      mkv: 'video/x-matroska',
      wav: 'audio/wav',
      mp3: 'audio/mpeg',
    };
    return mimeTypes[format] || 'application/octet-stream';
  }
}
