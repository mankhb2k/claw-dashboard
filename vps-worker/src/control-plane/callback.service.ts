import axios from 'axios';
import { Logger } from '../logger.ts';

export type ProjectStatus = 'CREATING' | 'RUNNING' | 'STARTING' | 'STOPPING' | 'STOPPED' | 'ERROR' | 'DESTROYING';

const logger = new Logger('CallbackService');

interface StatusUpdatePayload {
  projectId: string;
  status: ProjectStatus;
  containerId?: string;
  exitCode?: number;
  errorMessage?: string;
}

export class CallbackService {
  private controlPlaneUrl = process.env.CONTROL_PLANE_URL || 'http://localhost:3001';
  private workerSecret = process.env.VPS_WORKER_SECRET || 'dev-secret';

  async updateProjectStatus(payload: StatusUpdatePayload): Promise<void> {
    const url = `${this.controlPlaneUrl}/api/internal/status`;

    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.workerSecret}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      logger.log(`Status update successful for project ${payload.projectId}: ${payload.status}`, {
        status: response.status,
      });
    } catch (err) {
      logger.error(`Failed to update project status ${payload.projectId}:`, err);
      throw err;
    }
  }

  async heartbeat(projectId: string): Promise<void> {
    const url = `${this.controlPlaneUrl}/api/internal/heartbeat`;

    try {
      await axios.post(
        url,
        { projectId },
        {
          headers: {
            'Authorization': `Bearer ${this.workerSecret}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        },
      );
      logger.debug(`Heartbeat sent for project ${projectId}`);
    } catch (err) {
      logger.warn(`Failed to send heartbeat for ${projectId}:`, err);
    }
  }
}
