import Docker from 'dockerode';
import { CONTAINER_STATE_DIR } from '@aucobot/workspace-sync';
import { toDockerBindSource } from './to-docker-bind-source.js';

const GATEWAY_PORT = 18789;

function spawnTimeoutMs(): number {
  const n = Number(process.env.OPENCLAW_SPAWN_TIMEOUT_MS ?? 60_000);
  return Math.max(15_000, Number.isFinite(n) ? n : 60_000);
}

function healthPollIntervalMs(): number {
  const n = Number(process.env.OPENCLAW_HEALTH_INTERVAL_MS ?? 2000);
  return Math.max(500, Number.isFinite(n) ? n : 2000);
}

function healthFetchTimeoutMs(): number {
  const n = Number(process.env.OPENCLAW_HEALTH_FETCH_TIMEOUT_MS ?? 3000);
  return Math.max(1000, Number.isFinite(n) ? n : 3000);
}

export type SpawnResult = {
  containerId: string;
  containerName: string;
  hostPort: number;
  gatewayToken: string;
};

export type FleetLog = {
  log: (message: string) => void;
};

const defaultLog: FleetLog = {
  log: (message) => console.log(`[fleet] ${message}`),
};

/** Cloud: spawn one OpenClaw worker container per project (dockerode). */
export class DockerPerProjectProvisioner {
  private readonly docker = new Docker();

  constructor(private readonly logger: FleetLog = defaultLog) {}

  imageRef(): string {
    return process.env.OPENCLAW_IMAGE?.trim() || 'mankhb2k/clawsaas-worker:1.0.0';
  }

  async ping(): Promise<void> {
    await this.docker.ping();
  }

  async ensureImage(): Promise<void> {
    const image = this.imageRef();
    try {
      await this.docker.getImage(image).inspect();
      return;
    } catch {
      this.logger.log(`Pulling image ${image}…`);
    }
    await new Promise<void>((resolve, reject) => {
      this.docker.pull(image, (err: Error | null, stream: NodeJS.ReadableStream | undefined) => {
        if (err || !stream) return reject(err ?? new Error('pull failed'));
        this.docker.modem.followProgress(stream, (pullErr: Error | null) =>
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
    await this.ping();
    await this.ensureImage();
    const image = this.imageRef();
    const containerName = `oc-${params.subdomain}`;
    const gatewayToken = params.gatewayToken;
    const bindSource = toDockerBindSource(params.hostDataPath);

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

    let containerId = '';
    try {
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
      containerId = inspect.Id;
      const binding = inspect.NetworkSettings?.Ports?.[`${GATEWAY_PORT}/tcp`]?.[0];
      const hostPort = binding?.HostPort ? Number(binding.HostPort) : 0;
      if (!hostPort) {
        throw new Error('Failed to resolve published gateway port');
      }

      await this.waitGatewayReady(hostPort, containerId);

      return {
        containerId,
        containerName,
        hostPort,
        gatewayToken,
      };
    } catch (err) {
      if (containerId) {
        await this.removeContainer(containerId);
      }
      const detail = err instanceof Error ? err.message : 'spawn failed';
      const logs = containerId ? await this.tailLogs(containerId, 20) : '';
      const hint =
        process.platform === 'win32'
          ? ' Trên Windows: bật Docker Desktop, share ổ đĩa chứa OPENCLAW_DATA_ROOT (Settings → Resources → File sharing).'
          : '';
      throw new Error(
        logs ? `${detail}${hint}\n--- container log ---\n${logs}` : `${detail}${hint}`,
      );
    }
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
    if (!hostPort) {
      throw new Error('Failed to resolve published gateway port');
    }
    await this.waitGatewayReady(hostPort, containerId);
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

  private async findByName(name: string) {
    const list = await this.docker.listContainers({ all: true, filters: { name: [name] } });
    const row = list.find((c) => c.Names?.some((n) => n === `/${name}` || n === name));
    return row ? this.docker.getContainer(row.Id) : null;
  }

  private async tailLogs(containerId: string, tail: number): Promise<string> {
    try {
      const container = this.docker.getContainer(containerId);
      const buf = await container.logs({
        stdout: true,
        stderr: true,
        tail,
        timestamps: false,
      });
      const text = Buffer.isBuffer(buf) ? buf.toString('utf8') : String(buf);
      return text.slice(-4000).trim();
    } catch {
      return '';
    }
  }

  private async waitGatewayReady(hostPort: number, containerId?: string): Promise<void> {
    const timeoutMs = spawnTimeoutMs();
    const intervalMs = healthPollIntervalMs();
    const fetchTimeoutMs = healthFetchTimeoutMs();
    const url = `http://127.0.0.1:${hostPort}/healthz`;
    const deadline = Date.now() + timeoutMs;
    let attempt = 0;

    this.logger.log(`Waiting for gateway ${url} (timeout ${Math.round(timeoutMs / 1000)}s)`);

    while (Date.now() < deadline) {
      attempt += 1;
      if (containerId) {
        const state = await this.syncRunning(containerId);
        if (state !== 'running') {
          const logs = await this.tailLogs(containerId, 30);
          throw new Error(
            `Container stopped before gateway became healthy (check ${url}).${logs ? `\n${logs}` : ''}`,
          );
        }
      }
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(fetchTimeoutMs) });
        if (res.ok) {
          this.logger.log(`Gateway ready at ${url} (attempt ${attempt})`);
          return;
        }
      } catch {
        /* retry until deadline */
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }

    const sec = Math.round(timeoutMs / 1000);
    throw new Error(
      `Gateway not healthy at ${url} after ${sec}s. Image: ${this.imageRef()}. Ensure Docker is running and port ${hostPort} is reachable on the host.`,
    );
  }
}

/** @deprecated Use `DockerPerProjectProvisioner` — legacy name from OSS api stub. */
export const DockerService = DockerPerProjectProvisioner;
