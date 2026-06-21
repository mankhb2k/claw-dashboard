# Aucobot Node

Desktop companion node for Aucobot — wraps the OpenClaw CLI (`openclaw node run`) and connects to your gateway as a **node** role device. Pair and manage nodes from the Aucobot dashboard (**Companion Nodes**).

**Repo:** `git@github.com:aucobot/node-device.git` — standalone (not part of the `aucobot` monorepo).

## Download

Pre-built installers are published on [GitHub Releases](https://github.com/aucobot/node-device/releases):

| Platform | File |
| -------- | ---- |
| Windows | `Aucobot Node Setup x.x.x.exe` |
| macOS | `Aucobot Node-x.x.x.dmg` |

New releases are built automatically on every push to `main`.

## Requirements

- **Electron 40+** (bundles **Node.js 24** — sufficient for the OpenClaw CLI when `node` is not on PATH)
- **Node.js 22.19+** on PATH (optional; used for dev/build scripts)
- **pnpm**
- A running **OpenClaw gateway** (e.g. `pnpm dev:runtime` in Aucobot OSS)
- A **pairing invite code** from Aucobot **Companion Nodes** (created in the dashboard)

## Quick start (development)

```bash
cd node-device
pnpm install
pnpm dev
```

This starts Vite (renderer), TypeScript watch (main/preload), and Electron.

## Production build

```bash
pnpm build
pnpm start
```

## Installers (local)

```bash
pnpm dist:mac   # macOS .dmg → release/
pnpm dist:win   # Windows NSIS installer → release/
```

## Pairing flow (invite only)

1. In Aucobot **Companion Nodes**, click **Create pairing code** and copy the `nd-inv-…` code.
2. In Aucobot Node, turn on the connection toggle → enter the **dashboard URL** and **pairing code**.
3. Click **Connect** — the app calls `POST /api/nodes/invites/redeem`, receives the gateway URL and token (stored internally, not entered manually), then spawns the CLI.
4. Approve the **device + node** on Companion Nodes when the app shows a pending approval state.

Invite codes expire after **15 minutes** and are **single-use**. On later launches you can flip the toggle to **reconnect** using the saved session (no new code needed unless pairing was removed).

Optional: enable **Launch at login** in Settings (starts minimized to the system tray).

## Data storage

| Data | Location |
|------|----------|
| Gateway URL, display name, dashboard URL | Encrypted via Electron `safeStorage` (when available) |
| Gateway token (after invite redeem) | Same encrypted config store (main process only — not shown in the UI) |
| Paired node identity | `~/.openclaw/node.json` (OpenClaw CLI) |
| Node registry / pairing state | OpenClaw **gateway** (Aucobot proxies RPC) |

No Postgres — the gateway is the source of truth.

## System tray

- Closing the window hides the app to the tray (macOS/Windows).
- Tray menu: show window, disconnect, quit.
- Optional **Launch at login** (starts hidden).

## WSL / remote gateway notes

- Run **Aucobot Node** on the machine that should act as the node (your Mac/Windows desktop).
- The gateway URL is assigned automatically when redeeming an invite (OSS default is usually `http://127.0.0.1:18789`).
- LAN / WSL2: ensure the gateway is reachable from the machine running the app; open the correct firewall port.

## Headless auto-connect

```bash
NODE_DEVICE_HEADLESS=1 \
NODE_DEVICE_AUTO_INVITE=nd-inv-... \
NODE_DEVICE_WEB_URL=http://localhost:3000 \
pnpm start
```

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Dev mode (HMR + Electron) |
| `pnpm build` | Compile main/preload + Vite renderer |
| `pnpm start` | Run Electron after build |
| `pnpm typecheck` | TypeScript check |
| `pnpm dist:mac` / `pnpm dist:win` | Packaged installers |

## Troubleshooting

### "OpenClaw CLI failed to run" / Node 22.19+ required

Electron **35** bundles Node ~22.16 (not sufficient for OpenClaw). Use **Electron 40+** (Node 24) or install **Node 22.19+** on PATH:

```bash
node -v   # must be >= v22.19.0
```

**Fix:**

1. Install [Node.js 22 LTS](https://nodejs.org) (or `nvm install 22 && nvm use 22`).
2. Close all Aucobot Node windows, then restart `pnpm dev` or the built app.
3. If multiple Node versions are installed, set `OPENCLAW_NODE=C:\path\to\node.exe` and restart the app.
4. In `node-device`, run `pnpm install` (ensure `node_modules/openclaw` exists).

Invite redeem may still succeed; the error appears when spawning `openclaw node run`.

## Architecture

- **Renderer:** Preact 10 + Vite + CSS Modules + Zod (UX validation)
- **Main:** config (`safeStorage`), IPC, tray, spawns OpenClaw CLI
- **Preload:** `contextBridge` → `window.nodeDevice`

## API (invite redeem)

| Endpoint | Auth | Description |
|----------|------|-------------|
| `POST /api/projects/:id/nodes/invites` | JWT | Create invite (dashboard) |
| `POST /api/nodes/invites/redeem` | Public | Redeem code → gateway URL + token |
