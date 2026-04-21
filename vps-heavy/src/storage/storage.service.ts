import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { Logger } from '../logger.ts';

const logger = new Logger('StorageService');

const DATA_DIR = process.env.DATA_DIR || '/data/users';
const MAX_OUTPUT_SIZE = parseInt(process.env.MAX_OUTPUT_SIZE || '500000000'); // 500MB default

export interface StorageResult {
  filePath: string; // relative path from /data/users/{userId}/
  size: number; // bytes
  checksum: string; // SHA256 hex
  format: string; // file extension
  mimeType: string;
}

export class StorageService {
  async saveResult(
    userId: string,
    jobId: string,
    inputBuffer: Buffer,
    fileExtension: string,
    mimeType: string,
  ): Promise<StorageResult> {
    // Validate size
    if (inputBuffer.length > MAX_OUTPUT_SIZE) {
      throw new Error(`Output size ${inputBuffer.length} exceeds max ${MAX_OUTPUT_SIZE}`);
    }

    // Create user heavy-tasks directory
    const userHeavyDir = path.join(DATA_DIR, userId, 'heavy-tasks');
    try {
      await fs.mkdir(userHeavyDir, { recursive: true });
    } catch (err) {
      logger.error(`Failed to create heavy tasks directory for ${userId}:`, err);
      throw err;
    }

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const filename = `job_${jobId}_${timestamp}.${fileExtension}`;
    const filePath = path.join(userHeavyDir, filename);
    const relativePath = `heavy-tasks/${filename}`;

    try {
      // Write file
      await fs.writeFile(filePath, inputBuffer);
      logger.log(`Result saved: ${userId}/${relativePath} (${inputBuffer.length} bytes)`);

      // Calculate checksum
      const checksum = crypto.createHash('sha256').update(inputBuffer).digest('hex');

      return {
        filePath: relativePath,
        size: inputBuffer.length,
        checksum,
        format: fileExtension,
        mimeType,
      };
    } catch (err) {
      logger.error(`Failed to save result for job ${jobId}:`, err);
      throw err;
    }
  }

  async saveFromFile(
    userId: string,
    jobId: string,
    inputPath: string,
    fileExtension: string,
    mimeType: string,
  ): Promise<StorageResult> {
    try {
      const buffer = await fs.readFile(inputPath);
      return await this.saveResult(userId, jobId, buffer, fileExtension, mimeType);
    } catch (err) {
      logger.error(`Failed to read input file ${inputPath}:`, err);
      throw err;
    }
  }

  async getQuotaUsage(userId: string): Promise<{ used: number; quota: number; percentage: number }> {
    const userDataDir = path.join(DATA_DIR, userId);
    const quota = 4 * 1024 * 1024 * 1024; // 4GB default

    try {
      let used = 0;
      const walk = async (dir: string) => {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await walk(fullPath);
          } else {
            const stat = await fs.stat(fullPath);
            used += stat.size;
          }
        }
      };

      await walk(userDataDir).catch(() => {
        // Directory doesn't exist yet
      });

      return {
        used,
        quota,
        percentage: Math.round((used / quota) * 100),
      };
    } catch (err) {
      logger.warn(`Failed to calculate quota for ${userId}:`, err);
      return { used: 0, quota, percentage: 0 };
    }
  }

  async checkQuotaAvailable(userId: string, requiredSize: number): Promise<boolean> {
    const usage = await this.getQuotaUsage(userId);
    const available = usage.quota - usage.used;
    return available > requiredSize;
  }

  async listResults(userId: string): Promise<Array<{ name: string; size: number; modified: Date }>> {
    const heavyDir = path.join(DATA_DIR, userId, 'heavy-tasks');

    try {
      const files = await fs.readdir(heavyDir, { withFileTypes: true });
      const results = [];

      for (const file of files) {
        if (!file.isDirectory()) {
          const fullPath = path.join(heavyDir, file.name);
          const stat = await fs.stat(fullPath);
          results.push({
            name: file.name,
            size: stat.size,
            modified: stat.mtime,
          });
        }
      }

      return results.sort((a, b) => b.modified.getTime() - a.modified.getTime());
    } catch (err) {
      if ((err as any).code === 'ENOENT') {
        return []; // Directory doesn't exist
      }
      logger.warn(`Failed to list results for ${userId}:`, err);
      return [];
    }
  }

  async deleteResult(userId: string, filename: string): Promise<void> {
    const filePath = path.join(DATA_DIR, userId, 'heavy-tasks', filename);

    // Prevent directory traversal
    const resolved = path.resolve(filePath);
    const userDir = path.resolve(DATA_DIR, userId);
    if (!resolved.startsWith(userDir)) {
      throw new Error('Invalid file path');
    }

    try {
      await fs.unlink(filePath);
      logger.log(`Result deleted: ${userId}/${filename}`);
    } catch (err) {
      logger.warn(`Failed to delete result ${filePath}:`, err);
    }
  }
}
