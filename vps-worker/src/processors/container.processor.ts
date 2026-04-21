import { Queue, Job, Worker } from 'bull';
import { DockerService } from '../docker/docker.service.ts';
import { CallbackService } from '../control-plane/callback.service.ts';
import { Logger } from '../logger.ts';

const logger = new Logger('ContainerProcessor');

interface SpawnJobData {
  projectId: string;
  userId: string;
  subdomain: string;
  imageVersion: string;
  cpuLimit: number;
  ramLimit: number;
  plan: 'free' | 'pro';
}

interface WakeJobData {
  projectId: string;
  userId: string;
}

interface StopJobData {
  projectId: string;
  userId: string;
}

interface DestroyJobData {
  projectId: string;
  userId: string;
}

export class ContainerProcessor {
  private docker = new DockerService();
  private callback = new CallbackService();
  private worker: Worker<any> | null = null;

  constructor(private queue: Queue) {}

  async start(): Promise<void> {
    this.worker = new Worker<any>('container-ops', this.processJob.bind(this), {
      concurrency: 5,
      connection: this.queue.client.options as any,
    });

    this.worker.on('completed', (job) => {
      logger.log(`Job completed: ${job.name} - ${job.data.projectId}`);
    });

    this.worker.on('failed', (job, err) => {
      logger.error(`Job failed: ${job?.name} - ${job?.data.projectId}: ${err.message}`);
    });

    logger.log('Container processor started');
  }

  async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      logger.log('Container processor stopped');
    }
  }

  private async processJob(job: Job<any>): Promise<void> {
    const { name, data } = job;
    logger.log(`Processing job: ${name}`, { projectId: data.projectId, userId: data.userId });

    try {
      switch (name) {
        case 'spawn':
          await this.handleSpawn(data as SpawnJobData);
          break;
        case 'wake':
          await this.handleWake(data as WakeJobData);
          break;
        case 'stop':
          await this.handleStop(data as StopJobData);
          break;
        case 'destroy':
          await this.handleDestroy(data as DestroyJobData);
          break;
        default:
          throw new Error(`Unknown job type: ${name}`);
      }
    } catch (err) {
      logger.error(`Error processing ${name} for project ${data.projectId}:`, err);
      await this.callback.updateProjectStatus({
        projectId: data.projectId,
        status: 'ERROR',
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
      });
      throw err;
    }
  }

  private async handleSpawn(data: SpawnJobData): Promise<void> {
    const { projectId, userId, subdomain, plan, imageVersion } = data;

    logger.log(`[Spawn] Creating container for project ${projectId}`);

    // Create container
    const containerId = await this.docker.createContainer({
      userId,
      projectId,
      subdomain,
      plan,
      imageVersion,
    });

    // Start container
    await this.docker.startContainer(containerId);

    // Wait for health check
    const containerName = `openclaw-${userId}`;
    await this.docker.waitHealthy(containerName, { timeoutMs: 30_000 });

    // Notify control plane
    await this.callback.updateProjectStatus({
      projectId,
      status: 'RUNNING',
      containerId,
    });

    logger.log(`[Spawn] ✓ Container spawned successfully: ${projectId}`);
  }

  private async handleWake(data: WakeJobData): Promise<void> {
    const { projectId, userId } = data;

    logger.log(`[Wake] Starting container for project ${projectId}`);

    const containerInfo = await this.docker.getContainerInfo(userId);
    if (!containerInfo) {
      // Container doesn't exist, re-spawn
      logger.warn(`[Wake] Container not found, will be re-spawned by control plane: ${projectId}`);
      await this.callback.updateProjectStatus({
        projectId,
        status: 'ERROR',
        errorMessage: 'Container not found',
      });
      return;
    }

    const containerId = containerInfo.Id;

    // Start container
    await this.docker.startContainer(containerId);

    // Wait for health check
    const containerName = `openclaw-${userId}`;
    await this.docker.waitHealthy(containerName, { timeoutMs: 20_000 });

    // Notify control plane
    await this.callback.updateProjectStatus({
      projectId,
      status: 'RUNNING',
    });

    logger.log(`[Wake] ✓ Container woken up successfully: ${projectId}`);
  }

  private async handleStop(data: StopJobData): Promise<void> {
    const { projectId, userId } = data;

    logger.log(`[Stop] Stopping container for project ${projectId}`);

    const containerInfo = await this.docker.getContainerInfo(userId);
    if (!containerInfo) {
      logger.warn(`[Stop] Container not found: ${projectId}`);
      return;
    }

    // Stop with graceful timeout: SIGTERM → 10s → SIGKILL
    await this.docker.stopContainer(containerInfo.Id, 10);

    // Notify control plane
    await this.callback.updateProjectStatus({
      projectId,
      status: 'STOPPED',
    });

    logger.log(`[Stop] ✓ Container stopped successfully: ${projectId}`);
  }

  private async handleDestroy(data: DestroyJobData): Promise<void> {
    const { projectId, userId } = data;

    logger.log(`[Destroy] Destroying project ${projectId}`);

    const containerInfo = await this.docker.getContainerInfo(userId);

    if (containerInfo) {
      // Stop container first (force, don't wait)
      try {
        await this.docker.stopContainer(containerInfo.Id, 5);
      } catch (err) {
        logger.warn(`[Destroy] Failed to stop container during destroy: ${projectId}`, err);
      }

      // Remove container
      await this.docker.removeContainer(containerInfo.Id);
    }

    // Cleanup user data
    await this.docker.cleanupUserData(userId);

    // Notify control plane
    await this.callback.updateProjectStatus({
      projectId,
      status: 'STOPPED', // Mark as stopped, not destroyed (control plane owns the destroy state)
    });

    logger.log(`[Destroy] ✓ Project destroyed successfully: ${projectId}`);
  }
}
