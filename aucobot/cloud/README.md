# AucoBot Cloud (private)

Hosted Cloud — tách khỏi OSS public ở root.

| Path | Vai trò |
| ---- | ------- |
| `cloud/api` | NestJS API, `RUNTIME_MODE=cloud`, docker.sock |
| `cloud/web` | Dashboard branded / extend `apps/web` |
| `cloud/packages/*` | Billing, fleet, quota, ingress (`@aucobot-cloud/*`) — **riêng cloud** |
| `cloud/deploy/` | K8s, fleet templates, Traefik — Phase 4 |

**Shared packages** (`packages/*` ở root): `database`, `control-plane-core`, … — OSS + cloud đều import.

**OSS self-host:** `apps/api`, `apps/web`, `deploy/`.

Chi tiết: `docs/monorepoplan.md`
