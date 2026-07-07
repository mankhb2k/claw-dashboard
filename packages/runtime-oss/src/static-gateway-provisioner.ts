import type {
  ProvisionOpts,
  RuntimeHandle,
  RuntimeProvisioner,
  RuntimeStatus,
} from '@claw-dashboard/runtime-contracts';
import { resolveOssGatewayEndpoint } from './oss-gateway.js';
import { waitForGatewayHealth, type GatewayHealthLogger } from './gateway-health.js';

const OSS_ACTION_MSG =
  'OSS runtime uses a shared gateway container. Start or restart it with Docker (e.g. alpine/openclaw on port 18789), not per-project spawn.';

export class StaticGatewayProvisioner implements RuntimeProvisioner {
  constructor(private readonly log?: GatewayHealthLogger) {}

  async provision(projectId: string, opts: ProvisionOpts): Promise<RuntimeHandle> {
    await opts.onBootstrap(projectId, opts.gatewayToken);
    const endpoint = resolveOssGatewayEndpoint({ gatewayToken: opts.gatewayToken });
    await waitForGatewayHealth(endpoint.httpBaseUrl, this.log);
    return { projectId, mode: 'oss', gatewayToken: opts.gatewayToken };
  }

  async start(_handle: RuntimeHandle): Promise<void> {
    throw new Error(OSS_ACTION_MSG);
  }

  async stop(_handle: RuntimeHandle): Promise<void> {
    throw new Error(OSS_ACTION_MSG);
  }

  async destroy(_handle: RuntimeHandle): Promise<void> {
    throw new Error(OSS_ACTION_MSG);
  }

  async getStatus(handle: RuntimeHandle): Promise<RuntimeStatus> {
    try {
      const endpoint = resolveOssGatewayEndpoint({ gatewayToken: handle.gatewayToken });
      const url = `${endpoint.httpBaseUrl.replace(/\/$/, '')}/healthz`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      return res.ok ? 'running' : 'error';
    } catch {
      return 'error';
    }
  }
}
