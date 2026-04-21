# OpenClaw Worker (Control-UI Deploy Guide)

This directory runs OpenClaw with a forked dashboard at `control-ui/`.

The goal of this guide is to deploy OpenClaw where the served dashboard is
**Control-UI** (not upstream default UI).

## Prerequisites

- Docker Desktop installed and daemon running.
- Node.js available (for local build scripts).
- Dependencies installed in this folder (`npm install` in `worker/` and
  `worker/control-ui/`).

## Directory map (important parts)

- `control-ui/`: Control-UI source (Vite + Lit).
- `vendor/control-ui/`: built static assets consumed at runtime.
- `Dockerfile.control-ui`: runtime image wrapper that injects `vendor/control-ui`.
- `package.json`: helper scripts for build/run.

## Scripts

- `npm run ui:build`: build Control-UI into `vendor/control-ui`.
- `npm run docker:build:control-ui`: build Docker image `openclaw-control-ui:local`.
- `npm run docker:run:control-ui`: run container on `:18789` with token auth.
- `npm run gateway:run`: run local gateway on loopback `127.0.0.1:18789`.
- `npm run dashboard:url`: print dashboard URL from current auth context.

## Deploy with Docker (Control-UI as dashboard)

### 1) Build Control-UI artifacts

```bash
cd worker
npm run ui:build
```

Expected output:

- `worker/vendor/control-ui/index.html`
- `worker/vendor/control-ui/assets/*`

### 2) Build Docker image

```bash
npm run docker:build:control-ui
```

This uses `Dockerfile.control-ui`, which:

- starts from `openclaw:2026.4.5`,
- copies `vendor/control-ui` into `/app/vendor/control-ui`,
- configures `gateway.controlUi.root` to `/app/vendor/control-ui`,
- starts gateway with token auth on port `18789`.

### 3) Run container

```bash
npm run docker:run:control-ui
```

Default token used by the script:

- `dev-openclaw-token-18789`

Override token for a real deployment:

```bash
docker run --rm --name openclaw-control-ui \
  -p 18789:18789 \
  -e OPENCLAW_GATEWAY_TOKEN="replace-with-strong-token" \
  openclaw-control-ui:local
```

### 4) Verify runtime

- Health endpoint:
  - `http://127.0.0.1:18789/healthz` should return `200`.
- Dashboard:
  - `http://127.0.0.1:18789/`
- Auth check:
  - correct token connects,
  - wrong token should return `token_mismatch`.

## Local non-Docker verification flow

If you want to verify quickly without Docker:

```bash
cd worker
npm run ui:build
openclaw config set gateway.controlUi.root "D:/NextJS/openclaw-saas/worker/vendor/control-ui"
npm run gateway:run
```

Then open `http://127.0.0.1:18789`.

## Troubleshooting

### Docker build fails with daemon pipe error

Symptom (Windows):

- `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`

Fix:

- Start Docker Desktop and wait until engine is healthy.
- Re-run `npm run docker:build:control-ui`.

### Dashboard keeps showing token mismatch

Common causes:

- Token typed in UI does not match gateway token exactly.
- UI cached old token in browser storage.

Fix:

1. Use the exact token from `OPENCLAW_GATEWAY_TOKEN`.
2. Hard refresh (`Ctrl+F5`) or clear site storage.
3. Restart gateway/container.

### Gateway serves wrong UI

Ensure:

- `vendor/control-ui/index.html` exists and is fresh from `npm run ui:build`.
- Runtime root is set to Control-UI:
  - in Docker image: `/app/vendor/control-ui` (already set by `Dockerfile.control-ui`),
  - in local run: `gateway.controlUi.root` points to `worker/vendor/control-ui`.

### Telegram getUpdates conflict (409)

Cause:

- Another Telegram bot instance is running with the same bot token.

Fix:

- Stop duplicate OpenClaw/gateway instance(s),
- keep only one active poller per bot token.
