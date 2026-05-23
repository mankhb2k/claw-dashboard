import { Injectable, Logger } from '@nestjs/common';
import Docker from 'dockerode';
import path from 'node:path';
import { CONTAINER_STATE_DIR } from '../workspace/openclaw-config';

const GATEWAY_PORT = 18789;

/** Mặc định ~3 phút: 60 lần × (fetch 3s + nghỉ 2s). */
function healthPollConfig() {
  const attempts = Math.max(1, Number(process.env.OPENCLAW_HEALTH_ATTEMPTS ?? 60) || 60);
  const intervalMs = Math.max(500, Number(process.env.OPENCLAW_HEALTH_INTERVAL_MS ?? 2000) || 2000);
  const fetchTimeoutMs = Math.max(
    1000,
    Number(process.env.OPENCLAW_HEALTH_FETCH_TIMEOUT_MS ?? 3000) || 3000,
  );
  return { attempts, intervalMs, fetchTimeoutMs };
}

export type SpawnResult = {
  containerId: string;
  containerName: string;
  hostPort: number;
  gatewayToken: string;
};

@Injectable()
export class DockerService {
  private readonly log = new Logger(DockerService.name);
  private readonly docker = new Docker();

  imageRef(): string {
    return process.env.OPENCLAW_IMAGE?.trim() || 'mankhb2k/clawsaas-worker:1.0.0';
  }

  async ensureImage(): Promise<void> {
    const image = this.imageRef();
    try {
      await this.docker.getImage(image).inspect();
      return;
    } catch {
      this.log.log(`Pulling image ${image}…`);
    }
    await new Promise<void>((resolve, reject) => {
      this.docker.pull(image, (err, stream) => {
        if (err || !stream) return reject(err ?? new Error('pull failed'));
        this.docker.modem.followProgress(stream, (pullErr) =>
          pullErr ? reject(pullErr) : resolve(),
        );
      });
    });
  }

  async spawnWorker(params: {
    subdomain: string;
    hostDataPath: string;
    gatewayToken: string;
  }): Promise<SpawnResult> {
    await this.ensureImage();
    const image = this.imageRef();
    const containerName = `oc-${params.subdomain}`;
    const gatewayToken = params.gatewayToken;
    const bindSource = path.resolve(params.hostDataPath);

    const existing = await this.findByName(containerName);
    if (existing) {
      try {
        await existing.stop({ t: 5 });
      } catch {
        /* already stopped */
      }
      try {
        await existing.remove({ force: true });
      } catch {
        /* ignore */
      }
    }

    const container = await this.docker.createContainer({
      Image: image,
      name: containerName,
      Env: [
        `OPENCLAW_GATEWAY_TOKEN=${gatewayToken}`,
        `OPENCLAW_STATE_DIR=${CONTAINER_STATE_DIR}`,
        `OPENCLAW_CONFIG_PATH=${CONTAINER_STATE_DIR}/openclaw.json`,
        'NODE_ENV=production',
      ],
      Cmd: ['node', 'openclaw.mjs', 'gateway', '--bind', 'lan'],
      ExposedPorts: { [`${GATEWAY_PORT}/tcp`]: {} },
      HostConfig: {
        Binds: [`${bindSource}:${CONTAINER_STATE_DIR}`],
        PortBindings: {
          [`${GATEWAY_PORT}/tcp`]: [{ HostIp: '127.0.0.1', HostPort: '0' }],
        },
        RestartPolicy: { Name: 'unless-stopped' },
      },
    });

    await container.start();
    const inspect = await container.inspect();
    const binding = inspect.NetworkSettings?.Ports?.[`${GATEWAY_PORT}/tcp`]?.[0];
    const hostPort = binding?.HostPort ? Number(binding.HostPort) : 0;
    if (!hostPort) {
      throw new Error('Failed to resolve published gateway port');
    }

    await this.waitGatewayReadyOrRunning(inspect.Id, hostPort);

    return {
      containerId: inspect.Id,
      containerName,
      hostPort,
      gatewayToken,
    };
  }

  async startContainer(containerId: string): Promise<number> {
    const container = this.docker.getContainer(containerId);
    const inspect = await container.inspect();
    if (!inspect.State?.Running) {
      await container.start();
    }
    const refreshed = await container.inspect();
    const binding = refreshed.NetworkSettings?.Ports?.[`${GATEWAY_PORT}/tcp`]?.[0];
    const hostPort = binding?.HostPort ? Number(binding.HostPort) : 0;
    if (hostPort) await this.waitGatewayReadyOrRunning(containerId, hostPort);
    return hostPort;
  }

  async stopContainer(containerId: string): Promise<void> {
    const container = this.docker.getContainer(containerId);
    try {
      await container.stop({ t: 10 });
    } catch {
      /* already stopped */
    }
  }

  async syncRunning(containerId: string): Promise<'running' | 'stopped' | 'missing'> {
    try {
      const inspect = await this.docker.getContainer(containerId).inspect();
      return inspect.State?.Running ? 'running' : 'stopped';
    } catch {
      return 'missing';
    }
  }

  /** Published host port for gateway (changes when container is recreated/restarted). */
  async getPublishedPort(containerId: string): Promise<number> {
    try {
      const inspect = await this.docker.getContainer(containerId).inspect();
      const binding = inspect.NetworkSettings?.Ports?.[`${GATEWAY_PORT}/tcp`]?.[0];
      return binding?.HostPort ? Number(binding.HostPort) : 0;
    } catch {
      return 0;
    }
  }

  async removeContainer(containerId: string): Promise<void> {
    const container = this.docker.getContainer(containerId);
    try {
      await container.stop({ t: 5 });
    } catch {
      /* ignore */
    }
    try {
      await container.remove({ force: true });
    } catch {
      /* ignore */
    }
  }

  workerContainerName(subdomain: string): string {
    return `oc-${subdomain}`;
  }

  /** Tìm worker theo tên (khi DB còn containerId cũ sau respawn / recreate). */
  async resolveWorkerBySubdomain(subdomain: string): Promise<{
    containerId: string;
    containerName: string;
    hostPort: number;
    running: boolean;
  } | null> {
    const containerName = this.workerContainerName(subdomain);
    const list = await this.docker.listContainers({
      all: true,
      filters: { name: [containerName] },
    });
    const row = list.find((c) => c.Names?.some((n) => n === `/${containerName}` || n === containerName));
    if (!row) return null;
    const running = row.State === 'running';
    let hostPort = 0;
    const binding = row.Ports?.find((p) => p.PrivatePort === GATEWAY_PORT);
    if (binding?.PublicPort) {
      hostPort = Number(binding.PublicPort);
    }
    if (running && !hostPort) {
      hostPort = await this.getPublishedPort(row.Id);
    }
    return {
      containerId: row.Id,
      containerName,
      hostPort,
      running,
    };
  }

  private async findByName(name: string) {
    const list = await this.docker.listContainers({ all: true, filters: { name: [name] } });
    const row = list.find((c) => c.Names?.some((n) => n === `/${name}` || n === name));
    return row ? this.docker.getContainer(row.Id) : null;
  }

  /** Healthz chậm/fail trên Windows — vẫn cho spawn xong nếu container Docker đang chạy. */
  private async waitGatewayReadyOrRunning(containerId: string, hostPort: number): Promise<void> {
    try {
      await this.waitGatewayReady(hostPort);
    } catch (err) {
      const state = await this.syncRunning(containerId);
      if (state !== 'running') throw err;
      const message = err instanceof Error ? err.message : String(err);
      this.log.warn(
        `Gateway health not ready yet (${message}); container is running — continuing.`,
      );
    }
  }

  private async waitGatewayReady(hostPort: number): Promise<void> {
    const { attempts, intervalMs, fetchTimeoutMs } = healthPollConfig();
    const url = `http://127.0.0.1:${hostPort}/healthz`;
    this.log.log(
      `Waiting for gateway ${url} (up to ~${Math.round((attempts * (fetchTimeoutMs + intervalMs)) / 1000)}s)`,
    );
    for (let i = 0; i < attempts; i++) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(fetchTimeoutMs) });
        if (res.ok) {
          this.log.log(`Gateway ready at ${url} (attempt ${i + 1})`);
          return;
        }
      } catch {
        /* retry */
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    throw new Error(
      `Gateway not healthy at ${url} after ${attempts} attempts (~${Math.round((attempts * (fetchTimeoutMs + intervalMs)) / 1000)}s)`,
    );
  }
}
