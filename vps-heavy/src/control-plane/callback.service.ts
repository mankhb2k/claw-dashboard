import axios from 'axios';
import { Logger } from '../logger.ts';

export type JobStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED' | 'CANCELLED';

const logger = new Logger('CallbackService');

interface JobResultPayload {
  jobId: string;
  status: JobStatus;
  resultPath?: string;
  size?: number;
  checksum?: string;
  errorMessage?: string;
}

export class CallbackService {
  private controlPlaneUrl = process.env.CONTROL_PLANE_URL || 'http://localhost:3001';
  private workerSecret = process.env.VPS_WORKER_SECRET || 'dev-secret';

  async updateJobResult(payload: JobResultPayload): Promise<void> {
    const url = `${this.controlPlaneUrl}/api/internal/job/${payload.jobId}/result`;

    try {
      const response = await axios.put(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.workerSecret}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      logger.log(`Job result updated: ${payload.jobId} → ${payload.status}`, {
        status: response.status,
        resultPath: payload.resultPath,
      });
    } catch (err) {
      logger.error(`Failed to update job result ${payload.jobId}:`, err);
      throw err;
    }
  }

  async notifyJobStart(jobId: string): Promise<void> {
    const url = `${this.controlPlaneUrl}/api/internal/job/${jobId}/result`;

    try {
      await axios.put(
        url,
        { jobId, status: 'PROCESSING' },
        {
          headers: {
            'Authorization': `Bearer ${this.workerSecret}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        },
      );
      logger.debug(`Job processing notification sent: ${jobId}`);
    } catch (err) {
      logger.warn(`Failed to notify job start ${jobId}:`, err);
    }
  }
}
