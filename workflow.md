# Claw Dashboard — Workflow (OSS)

> **SSOT control plane:** this file + [`README.md`](README.md)  
> **SSOT OpenClaw gateway:** [`openclaw-architecture.md`](openclaw-architecture.md) (paths relative to [openclaw/openclaw](https://github.com/openclaw/openclaw))  
> **MCP connectors:** [`mcp.md`](mcp.md)

## OSS stack (4 services)

`web` (:8386) + `api` (:8387) + `gateway` (:18789) + `postgres` (:5432)

```powershell
docker compose -f deploy/docker-compose.yml up -d
```

## Flow

1. User opens Claw Dashboard → creates project (OSS: one project per user).
2. API syncs `openclaw.json`, workspace, connectors to shared volume.
3. Gateway reads volume and runs agents/channels.
4. Chat: browser → web → api → gateway WebSocket proxy.
5. Connectors: API writes stdio MCP entries; gateway spawns `npx` community packages.

## Monorepo layout

```
apps/api          @claw-dashboard/api
apps/web          @claw-dashboard/web
packages/*        shared libs
deploy/           Docker Compose
```

## Dev (host)

```powershell
pnpm install
pnpm dev:db
pnpm dev
```

Default login: `admin` / `admin123`
