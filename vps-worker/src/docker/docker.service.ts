import Docker from 'dockerode';
import * as fs from 'fs/promises';
import { Logger } from '../logger';

const logger = new Logger('DockerService');

interface ContainerConfig {
  userId: string;
  projectId: string;
  subdomain: string;
  plan: 'free' | 'pro';
  imageVersion: string;
}

const RESOURCE_LIMITS = {
  free: { memory: 1024 * 1024 * 1024, cpuQuota: 50_000 }, // 1GB, 0.5 vCPU
  pro: { memory: 2048 * 1024 * 1024, cpuQuota: 100_000 }, // 2GB, 1.0 vCPU
};

const DEFAULT_IMAGE = process.env.OPENCLAW_IMAGE || 'openclaw-gateway:latest';
const DATA_DIR = process.env.DATA_DIR || '/data/users';
const DOCKER_NETWORK = 'openclaw-net';

export class DockerService {
  private docker = new Docker();

  async createContainer(config: ContainerConfig): Promise<string> {
    const { userId, projectId, subdomain, plan, imageVersion } = config;
    const containerName = `openclaw-${userId}`;
    const limits = RESOURCE_LIMITS[plan] || RESOURCE_LIMITS.free;

    // Create user data directory
    try {
      await fs.mkdir(`${DATA_DIR}/${userId}`, { recursive: true });
    } catch (err) {
      logger.warn(`Failed to create data dir for ${userId}:`, err);
    }

    const containerConfig = {
      Image: imageVersion || DEFAULT_IMAGE,
      Hostname: containerName,
      HostConfig: {
        Memory: limits.memory,
        CpuQuota: limits.cpuQuota,
        CpuPeriod: 100_000,
        Binds: [`${DATA_DIR}/${userId}:/app/data`],
        NetworkMode: DOCKER_NETWORK,
        RestartPolicy: { Name: 'no' as const }, // CRITICAL: Control Plane manages lifecycle
      },
      Env: [
        `OPENCLAW_PLAN=${plan}`,
        `OPENCLAW_USER_ID=${userId}`,
        `OPENCLAW_PROJECT_ID=${projectId}`,
      ],
      Labels: {
        'traefik.enable': 'true',
        [`traefik.http.routers.${userId}.rule`]: `Host(\`${subdomain}.openclaw.ai\`)`,
        [`traefik.http.routers.${userId}.tls.certresolver`]: 'cf',
        [`traefik.http.routers.${userId}.entrypoints`]: 'websecure',
        [`traefik.http.services.${userId}.loadbalancer.server.port`]: '3000',
        'openclaw.userId': userId,
        'openclaw.projectId': projectId,
        'openclaw.plan': plan,
      },
    };

    try {
      const container = await this.docker.createContainer(containerConfig);
      logger.log(`Container created: ${containerName} (${container.id.substring(0, 12)})`);
      return container.id;
    } catch (err) {
      logger.error(`Failed to create container ${containerName}:`, err);
      throw err;
    }
  }

  async startContainer(containerId: string): Promise<void> {
    try {
      const container = this.docker.getContainer(containerId);
      await container.start();
      logger.log(`Container started: ${containerId.substring(0, 12)}`);
    } catch (err) {
      logger.error(`Failed to start container ${containerId}:`, err);
      throw err;
    }
  }

  async stopContainer(containerId: string, timeout: number = 10): Promise<void> {
    try {
      const container = this.docker.getContainer(containerId);
      await container.stop({ t: timeout });
      logger.log(`Container stopped: ${containerId.substring(0, 12)}`);
    } catch (err) {
      logger.error(`Failed to stop container ${containerId}:`, err);
      throw err;
    }
  }

  async removeContainer(containerId: string): Promise<void> {
    try {
      const container = this.docker.getContainer(containerId);
      await container.remove({ force: true });
      logger.log(`Container removed: ${containerId.substring(0, 12)}`);
    } catch (err) {
      logger.error(`Failed to remove container ${containerId}:`, err);
      throw err;
    }
  }

  async waitHealthy(
    containerName: string,
    options: { timeoutMs: number; checkInterval: number } = { timeoutMs: 30_000, checkInterval: 2_000 },
  ): Promise<void> {
    const deadline = Date.now() + options.timeoutMs;

    while (Date.now() < deadline) {
      try {
        const response = await fetch(`http://${containerName}:3000/health`);
        if (response.ok) {
          logger.log(`Health check passed: ${containerName}`);
          return;
        }
      } catch (err) {
        // Container not ready yet
      }
      await new Promise((resolve) => setTimeout(resolve, options.checkInterval));
    }

    throw new Error(`Container ${containerName} failed health check after ${options.timeoutMs}ms`);
  }

  async getContainerInfo(userId: string): Promise<Docker.ContainerInspectInfo | null> {
    try {
      const containerName = `openclaw-${userId}`;
      const container = this.docker.getContainer(containerName);
      return await container.inspect();
    } catch (err) {
      return null;
    }
  }

  async listRunningContainers(): Promise<Docker.ContainerInspectInfo[]> {
    try {
      const containers = await this.docker.listContainers({ filters: { label: ['openclaw.userId'] } });
      const detailed = await Promise.all(
        containers.map((c) =>
          this.docker.getContainer(c.Id).inspect().catch(() => null),
        ),
      );
      return detailed.filter((c): c is Docker.ContainerInspectInfo => c !== null);
    } catch (err) {
      logger.error('Failed to list containers:', err);
      return [];
    }
  }

  async cleanupUserData(userId: string): Promise<void> {
    const userPath = `${DATA_DIR}/${userId}`;
    try {
      await fs.rm(userPath, { recursive: true, force: true });
      logger.log(`User data cleaned up: ${userId}`);
    } catch (err) {
      logger.warn(`Failed to cleanup user data ${userId}:`, err);
    }
  }
}
