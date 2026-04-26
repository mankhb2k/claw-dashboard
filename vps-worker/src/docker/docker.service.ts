import Docker from 'dockerode';
import * as fs from 'fs/promises';
import { Logger } from '../logger.js';

const logger = new Logger('DockerService');

const DEFAULT_IMAGE = process.env.OPENCLAW_IMAGE || 'openclaw-gateway:latest';
const DATA_DIR = process.env.DATA_DIR || '/data/users';
const DOCKER_NETWORK = 'openclaw-net';
const APP_DOMAIN = (process.env.APP_DOMAIN || 'clawsandbox.cloud')
  .replace(/^https?:\/\//i, '')
  .split('/')[0]
  .replace(/:\d+$/, '')
  .trim() || 'clawsandbox.cloud';

function containerNameForSubdomain(subdomain: string): string {
  return `openclaw-${subdomain}`;
}

function traefikKey(projectId: string): string {
  return projectId.replace(/[^a-zA-Z0-9_]/g, '_');
}

export interface ContainerConfig {
  userId: string;
  projectId: string;
  subdomain: string;
  plan: 'free' | 'pro';
  imageVersion: string;
  /** MB */
  ramLimit: number;
  /** vCPU (e.g. 0.5, 1) */
  cpuLimit: number;
}

export class DockerService {
  private docker = new Docker();

  async createContainer(config: ContainerConfig): Promise<string> {
    const { userId, projectId, subdomain, plan, imageVersion, ramLimit, cpuLimit } = config;
    const name = containerNameForSubdomain(subdomain);
    const key = traefikKey(projectId);
    const image = (imageVersion || DEFAULT_IMAGE).trim() || DEFAULT_IMAGE;
    const memory = ramLimit * 1024 * 1024;
    const cpuQuota = Math.max(1, Math.round(Number(cpuLimit) * 100_000));

    const dataPath = `${DATA_DIR}/${userId}/${projectId}`;

    try {
      await fs.mkdir(dataPath, { recursive: true });
    } catch (err) {
      logger.warn(`Failed to create data dir for ${dataPath}:`, err);
    }

    const hostRule = `Host(\`${subdomain}.${APP_DOMAIN}\`)`;

    const containerConfig = {
      name,
      Image: image,
      Hostname: name,
      // Override cmd to inject controlUi config before gateway run so it can bind to non-loopback
      Cmd: [
        'sh', '-lc',
        [
          'node_modules/openclaw/openclaw.mjs config set gateway.controlUi.root /app/vendor/control-ui',
          'node_modules/openclaw/openclaw.mjs config set gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback true',
          'node_modules/openclaw/openclaw.mjs gateway run --allow-unconfigured --bind lan --port 18789 --auth token --token "${OPENCLAW_GATEWAY_TOKEN:-dev-openclaw-token-18789}"',
        ].join(' && '),
      ],
      HostConfig: {
        Memory: memory,
        CpuQuota: cpuQuota,
        CpuPeriod: 100_000,
        Binds: [`${dataPath}:/app/data`],
        NetworkMode: DOCKER_NETWORK,
        RestartPolicy: { Name: 'no' as const },
      },
      Env: [
        `OPENCLAW_PLAN=${plan}`,
        `OPENCLAW_USER_ID=${userId}`,
        `OPENCLAW_PROJECT_ID=${projectId}`,
        // Required: gateway needs this to start with non-loopback bind (--bind lan)
        `OPENCLAW_GATEWAY_CONTROL_UI_DANGEROUS_HOST_FALLBACK=true`,
        `APP_DOMAIN=${APP_DOMAIN}`,
      ],
      Labels: {
        'traefik.enable': 'true',
        [`traefik.http.routers.${key}.rule`]: hostRule,
        [`traefik.http.routers.${key}.tls.certresolver`]: 'cf',
        [`traefik.http.routers.${key}.entrypoints`]: 'websecure',
        [`traefik.http.routers.${key}.service`]: key,
        [`traefik.http.services.${key}.loadbalancer.server.port`]: '3000',
        'openclaw.userId': userId,
        'openclaw.projectId': projectId,
        'openclaw.subdomain': subdomain,
        'openclaw.plan': plan,
      },
    };

    try {
      const container = await this.docker.createContainer(containerConfig);
      logger.log(`Container created: ${name} (${container.id.substring(0, 12)})`);
      return container.id;
    } catch (err) {
      logger.error(`Failed to create container ${name}:`, err);
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
    options: { timeoutMs: number; checkInterval: number } = { timeoutMs: 60_000, checkInterval: 2_000 },
  ): Promise<void> {
    const deadline = Date.now() + options.timeoutMs;
    // openclaw-gateway runs on port 18789, not 3000
    const gatewayPort = 18789;

    while (Date.now() < deadline) {
      try {
        // Try root path since gateway may not have /health
        const response = await fetch(`http://${containerName}:${gatewayPort}/`);
        // Any response (even 401/403) means gateway is running
        if (response.status < 500) {
          logger.log(`Health check passed: ${containerName}:${gatewayPort} (HTTP ${response.status})`);
          return;
        }
      } catch (err) {
        // Container not ready yet, keep polling
      }
      await new Promise((resolve) => setTimeout(resolve, options.checkInterval));
    }

    throw new Error(`Container ${containerName} failed health check after ${options.timeoutMs}ms`);
  }

  async getContainerInfoBySubdomain(subdomain: string): Promise<Docker.ContainerInspectInfo | null> {
    const name = containerNameForSubdomain(subdomain);
    try {
      const container = this.docker.getContainer(name);
      return await container.inspect();
    } catch (err) {
      return null;
    }
  }

  async listRunningContainers(): Promise<Docker.ContainerInspectInfo[]> {
    try {
      const containers = await this.docker.listContainers({ filters: { label: ['openclaw.subdomain'] } });
      const detailed = await Promise.all(
        containers.map((c) => this.docker.getContainer(c.Id).inspect().catch(() => null)),
      );
      return detailed.filter((c): c is Docker.ContainerInspectInfo => c !== null);
    } catch (err) {
      logger.error('Failed to list containers:', err);
      return [];
    }
  }

  async cleanupProjectData(userId: string, projectId: string): Promise<void> {
    const projectPath = `${DATA_DIR}/${userId}/${projectId}`;
    try {
      await fs.rm(projectPath, { recursive: true, force: true });
      logger.log(`Project data cleaned up: ${projectPath}`);
    } catch (err) {
      logger.warn(`Failed to cleanup project data ${projectPath}:`, err);
    }
  }
}
