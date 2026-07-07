# Contributing (Claw Dashboard)

Instructions for AI agents working in this repo.

## Scope

| Path | Role |
| ---- | ---- |
| `apps/api` | NestJS API |
| `apps/web` | Next.js dashboard |
| `packages/*` | Shared `@claw-dashboard/*` libs |
| `deploy/` | Docker Compose |

Cursor rules: [`.cursor/rules/`](../.cursor/rules/) (`claw-dashboard-monorepo.mdc`, `claw-dashboard-packages.mdc`).

## Commands (repo root)

```bash
pnpm install
pnpm build:packages
pnpm dev
```

Env (local): `apps/.env` from `apps/.env.example`. Docker: `deploy/.env`, `deploy/.env.gateway`.

## OpenClaw gateway (upstream)

Not vendored here. Deploy uses image `alpine/openclaw` from https://github.com/openclaw/openclaw.

## Legacy siblings

`../backend/`, `../frontend/` — do not modify unless user asks.
