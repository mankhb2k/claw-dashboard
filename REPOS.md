# Claw Dashboard — repository layout

The active OSS control plane lives in **`studio/`** (this meta-repo).

## Recommended workspace layout

```text
claw-dashboard/
└── studio/          # Claw Dashboard monorepo (api, web, packages, deploy)
```

## `studio/` monorepo

| Path | Role |
| ---- | ---- |
| `studio/apps/api` | NestJS API |
| `studio/apps/web` | Next.js dashboard (Claw Dashboard) |
| `studio/packages/*` | Shared libs (`@claw-dashboard/*`) |
| `studio/deploy/` | Docker Compose + Dockerfiles |

Full stack: `docker compose -f studio/deploy/docker-compose.yml up`

## Legacy meta-repo

This repo (`claw-dashboard`) also contains reference docs: `workflow.md`, `openclaw-architecture.md`, `mcp.md`.
