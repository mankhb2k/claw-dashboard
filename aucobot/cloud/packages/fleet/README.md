# @aucobot-cloud/fleet

Docker **per-project** provisioning for Cloud runtime (`cloud-api`).

Ported from legacy `apps/api` `DockerService` — **not** used in OSS `@aucobot/api`.

## Usage

```typescript
import { DockerPerProjectProvisioner } from '@aucobot-cloud/fleet';

const fleet = new DockerPerProjectProvisioner();
const result = await fleet.spawnWorker({
  subdomain: project.subdomain,
  hostDataPath: '/data/projects/proj_xxx',
  gatewayToken: project.gatewayToken,
});
// result.hostPort, result.containerId
```

## Env

| Variable | Default | Purpose |
|----------|---------|---------|
| `OPENCLAW_IMAGE` | `mankhb2k/clawsaas-worker:1.0.0` | Worker image |
| `OPENCLAW_SPAWN_TIMEOUT_MS` | `60000` | Health wait timeout |
| `OPENCLAW_HEALTH_INTERVAL_MS` | `2000` | Poll interval |
| `OPENCLAW_HEALTH_FETCH_TIMEOUT_MS` | `3000` | Per health fetch timeout |

## OSS

Do **not** add `dockerode` or this package to `@aucobot/api`. Cloud API wires fleet when `RUNTIME_MODE=cloud`.
