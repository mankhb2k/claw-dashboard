# AGENTS.md — Claw Dashboard monorepo

Instructions for AI agents working in `studio/`.

## Docs (read before coding)

| Doc | When |
|-----|------|
| [docs/monorepoplan.md](./docs/monorepoplan.md) | Architecture, phases, folder map |
| [docs/monorepo-diagram.md](./docs/monorepo-diagram.md) | Flowcharts (runtime, compose, …) |

Root repo also has [../cursor.md](../cursor.md) — behavioral guidelines (simplicity, surgical diffs).

Cursor rules: [../.cursor/rules/](../.cursor/rules/) (`studio-monorepo.mdc`, `studio-packages.mdc`).

## Structure

```text
apps/api, apps/web     → runnable apps (self-host OSS)
packages/*             → shared libraries
deploy/                → Docker compose (postgres, api, web, gateway)
```

## Commands

```bash
cd studio
pnpm install
pnpm dev                              # api + web on host
pnpm --filter @claw-dashboard/api run build
pnpm --filter @claw-dashboard/web run build
pnpm dev:db                           # postgres only
docker compose -f deploy/docker-compose.yml up -d --build
```

Env (local): `studio/apps/.env` from `apps/.env.example` (API + Web). Optional `studio/apps/.env.local`. Docker: `deploy/.env`, `deploy/.env.gateway`.

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
| Types, `GatewayEndpointResolver`, `PlanGuard` | `@claw-dashboard/runtime-contracts` |
| OSS fixed gateway `:18789`, health poll | `@claw-dashboard/runtime-oss` |
| Gateway endpoint (self-host) | `apps/api/src/features/projects/runtime/gateway-endpoint.ts` |

## PR / task template for agents

```text
Task: [one sentence]
Scope: [exact paths]
Out of scope: [explicit]
Verify: [pnpm build commands]
Diagram: docs/monorepo-diagram.md §[n]
```

## Legacy (outside studio/)

`../backend/`, `../frontend/`, `../openclaw-fork/` — do not modify unless user asks. New work goes in `studio/` only.
