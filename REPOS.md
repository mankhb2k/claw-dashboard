# Claw Dashboard — repository layout

Single-repo OSS control plane: **api**, **web**, **packages**, **deploy**.

## Layout

```text
claw-dashboard/
├── apps/api          @claw-dashboard/api
├── apps/web          @claw-dashboard/web
├── packages/*        @claw-dashboard/*
├── deploy/           Docker Compose + Dockerfiles
├── workflow.md       Control-plane workflow (SSOT)
├── openclaw-architecture.md   OpenClaw gateway reference
└── mcp.md            MCP connectors (stdio npx)
```

Full stack:

```bash
docker compose -f deploy/docker-compose.yml up -d
```

## OpenClaw gateway (upstream)

Runtime gateway is **not** vendored in this repo. Deploy pulls the official image:

- **Repo:** https://github.com/openclaw/openclaw
- **Image:** `alpine/openclaw` (see `deploy/docker-compose.yml`)

Clone upstream locally when you need to read gateway source:

```bash
git clone https://github.com/openclaw/openclaw.git openclaw-upstream
```
