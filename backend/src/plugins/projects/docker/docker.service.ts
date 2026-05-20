import { Injectable, Logger } from '@nestjs/common';
import Docker from 'dockerode';
import { randomBytes } from 'node:crypto';

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

  async spawnWorker(subdomain: string): Promise<SpawnResult> {
    await this.ensureImage();
    const image = this.imageRef();
    const containerName = `oc-${subdomain}`;
    const gatewayToken = randomBytes(32).toString('base64url');

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
      Env: [`OPENCLAW_GATEWAY_TOKEN=${gatewayToken}`, 'NODE_ENV=production'],
      Cmd: ['node', 'openclaw.mjs', 'gateway', '--bind', 'lan'],
      ExposedPorts: { [`${GATEWAY_PORT}/tcp`]: {} },
      HostConfig: {
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

    await this.waitGatewayReady(hostPort);

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
    if (hostPort) await this.waitGatewayReady(hostPort);
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
