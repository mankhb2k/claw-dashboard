import { Queue, Job } from 'bull';
import { DockerService } from '../docker/docker.service.js';
import { CallbackService } from '../control-plane/callback.service.js';
import { Logger } from '../logger.js';

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
  subdomain: string;
}

interface StopJobData {
  projectId: string;
  userId: string;
  subdomain: string;
}

interface DestroyJobData {
  projectId: string;
  userId: string;
  subdomain: string;
}

function containerNameForSubdomain(subdomain: string): string {
  return `openclaw-${subdomain}`;
}

/** Gateway cold-start có thể vài phút; wake cùng image nên cùng ngân sách với spawn. */
const GATEWAY_HEALTH_TIMEOUT_MS = 300_000;
const GATEWAY_HEALTH_INTERVAL_MS = 3_000;

export class ContainerProcessor {
  private docker = new DockerService();
  private callback = new CallbackService();
  private started = false;

  constructor(private queue: Queue) {}

  async start(): Promise<void> {
    // Register a named handler for each job type so Bull can match them correctly.
    // queue.process(concurrency, handler) registers an *unnamed* handler which never
    // matches named jobs like 'spawn', 'wake', 'stop', 'destroy'.
    const concurrency = 5;
    for (const jobName of ['spawn', 'wake', 'stop', 'destroy'] as const) {
      this.queue.process(jobName, concurrency, async (job: Job<any>) => this.processJob(job));
    }

    this.queue.on('completed', (job: Job<any>) => {
      logger.log(`Job completed: ${job.name} - ${job.data.projectId}`);
    });

    this.queue.on('failed', (job: Job<any>, err: Error) => {
      logger.error(`Job failed: ${job?.name} - ${job?.data.projectId}: ${err.message}`);
    });

    this.started = true;
    logger.log('Container processor started');
  }

  async stop(): Promise<void> {
    if (this.started) {
      this.started = false;
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
      if (name !== 'destroy') {
        await this.callback.updateProjectStatus({
          projectId: data.projectId,
          status: 'ERROR',
          errorMessage: err instanceof Error ? err.message : 'Unknown error',
        });
      }
      throw err;
    }
  }

  private async handleSpawn(data: SpawnJobData): Promise<void> {
    const { projectId, userId, subdomain, plan, imageVersion, cpuLimit, ramLimit } = data;

    logger.log(`[Spawn] Creating container for project ${projectId}`);

    // Remove any pre-existing container with the same name to prevent 409 Conflict on retries
    const existing = await this.docker.getContainerInfoBySubdomain(subdomain);
    if (existing) {
      logger.log(`[Spawn] Removing pre-existing container for ${subdomain} before re-creating`);
      try {
        await this.docker.removeContainer(existing.Id);
      } catch (removeErr) {
        logger.warn(`[Spawn] Could not remove existing container, proceeding anyway:`, removeErr);
      }
    }

    const containerId = await this.docker.createContainer({
      userId,
      projectId,
      subdomain,
      plan,
      imageVersion,
      cpuLimit,
      ramLimit,
    });

    await this.docker.startContainer(containerId);

    const containerName = containerNameForSubdomain(subdomain);
    await this.docker.waitHealthy(containerName, {
      timeoutMs: GATEWAY_HEALTH_TIMEOUT_MS,
      checkInterval: GATEWAY_HEALTH_INTERVAL_MS,
    });

    await this.callback.updateProjectStatus({
      projectId,
      status: 'RUNNING',
      containerId,
    });

    logger.log(`[Spawn] ✓ Container spawned successfully: ${projectId}`);
  }

  private async handleWake(data: WakeJobData): Promise<void> {
    const { projectId, subdomain } = data;

    logger.log(`[Wake] Starting container for project ${projectId}`);

    const containerInfo = await this.docker.getContainerInfoBySubdomain(subdomain);
    if (!containerInfo) {
      logger.warn(`[Wake] Container not found, will be re-spawned by control plane: ${projectId}`);
      await this.callback.updateProjectStatus({
        projectId,
        status: 'ERROR',
        errorMessage: 'Container not found',
      });
      return;
    }

    const containerId = containerInfo.Id;

    await this.docker.startContainer(containerId);

    const containerName = containerNameForSubdomain(subdomain);
    await this.docker.waitHealthy(containerName, {
      timeoutMs: GATEWAY_HEALTH_TIMEOUT_MS,
      checkInterval: GATEWAY_HEALTH_INTERVAL_MS,
    });

    await this.callback.updateProjectStatus({
      projectId,
      status: 'RUNNING',
    });

    logger.log(`[Wake] ✓ Container woken up successfully: ${projectId}`);
  }

  private async handleStop(data: StopJobData): Promise<void> {
    const { projectId, subdomain } = data;

    logger.log(`[Stop] Stopping container for project ${projectId}`);

    const containerInfo = await this.docker.getContainerInfoBySubdomain(subdomain);
    if (!containerInfo) {
      logger.warn(`[Stop] Container not found: ${projectId}`);
      return;
    }

    await this.docker.stopContainer(containerInfo.Id, 10);

    await this.callback.updateProjectStatus({
      projectId,
      status: 'STOPPED',
    });

    logger.log(`[Stop] ✓ Container stopped successfully: ${projectId}`);
  }

  private async handleDestroy(data: DestroyJobData): Promise<void> {
    const { projectId, userId, subdomain } = data;

    logger.log(`[Destroy] Destroying project ${projectId}`);

    const containerInfo = await this.docker.getContainerInfoBySubdomain(subdomain);

    if (containerInfo) {
      try {
        await this.docker.stopContainer(containerInfo.Id, 5);
      } catch (err) {
        logger.warn(`[Destroy] Failed to stop container during destroy: ${projectId}`, err);
      }

      await this.docker.removeContainer(containerInfo.Id);
    }

    await this.docker.cleanupProjectData(userId, projectId);

    logger.log(`[Destroy] ✓ Project destroyed (local cleanup done): ${projectId}`);
  }
}
