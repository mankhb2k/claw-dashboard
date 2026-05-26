# AGENTS.md — AucoBot monorepo

Instructions for AI agents working in `aucobot/`.

## Docs (read before coding)

| Doc | When |
|-----|------|
| [docs/monorepoplan.md](./docs/monorepoplan.md) | Architecture, phases, folder map |
| [docs/monorepo-diagram.md](./docs/monorepo-diagram.md) | Flowcharts (runtime, compose, …) |
| [docs/workflow.md](./docs/workflow.md) | OSS vs Cloud behavior |

Root repo also has [../cursor.md](../cursor.md) — behavioral guidelines (simplicity, surgical diffs).

Cursor rules: [../.cursor/rules/](../.cursor/rules/) (`aucobot-monorepo.mdc`, `aucobot-packages.mdc`).

## Structure

```text
apps/api, apps/web     → runnable OSS apps
packages/*             → shared libraries (OSS public)
cloud/{api,web,packages,deploy} → hosted cloud (private skeleton)
deploy/                → OSS docker compose (postgres, api, web, gateway pull)
```

## Commands

```bash
cd aucobot
pnpm install
pnpm dev                              # api + web on host
pnpm --filter @aucobot/api run build
pnpm --filter @aucobot/web run build
pnpm dev:deps                         # postgres only
docker compose -f deploy/docker-compose.yml up -d --build
```

Env: `apps/api/.env`, `deploy/.env` (compose), `deploy/.env.gateway` (gateway dev).

## Extract package workflow (Phase 3)

1. Create package with minimal `src/index.ts` + `tsc` build.
2. Move code from `apps/api` (copy semantics, don’t rewrite).
3. Wire imports in `apps/api`; delete old files.
4. Update `apps/api/package.json` workspace deps + `deploy/Dockerfile.api` if needed.
5. Update `docs/monorepo-diagram.md` section.
6. Verify build.

## Runtime map

| Concern | Package |
|---------|---------|
| Types, `GatewayEndpointResolver`, `PlanGuard` | `@aucobot/runtime-contracts` |
| OSS fixed gateway `:18789`, health poll | `@aucobot/runtime-oss` |
| Cloud docker per project | `@aucobot-cloud/fleet` in `cloud/packages/` (future) |
| Cloud branch in API (temporary) | `apps/api/src/features/projects/runtime/gateway-endpoint.ts` |

## PR / task template for agents

```text
Task: [one sentence]
Scope: [exact paths]
Out of scope: [explicit]
Verify: [pnpm build commands]
Diagram: docs/monorepo-diagram.md §[n]
```

## Legacy (outside aucobot/)

`../backend/`, `../frontend/`, `../openclaw-worker/` — do not modify unless user asks. New work goes in `aucobot/` only.
