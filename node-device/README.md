# OpenClaw Node Device

Desktop companion node for OpenClaw — wraps the OpenClaw CLI (`openclaw node run`) and connects to your gateway as a **node** role device. Pair and manage nodes from the AucoBot dashboard (**Companion Nodes**).

Standalone package (not part of the `aucobot/` monorepo).

## Requirements

- **Node.js 22+**
- **pnpm**
- Running **OpenClaw gateway** (e.g. `pnpm dev:runtime` in AucoBot OSS)
- **Gateway access token** from AucoBot **Settings**

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

## Installers

```bash
pnpm dist:mac   # macOS .dmg → release/
pnpm dist:win   # Windows NSIS installer → release/
```

## Pairing flow (OSS MVP)

### Cách 1 — Pairing invite (khuyên dùng, Phase 2)

1. Trên AucoBot **Companion Nodes**, bấm **Tạo mã pairing** và copy mã `nd-inv-…`.
2. Trong OpenClaw Node, chọn tab **Pairing invite**.
3. Nhập **AucoBot API URL** (`http://localhost:3001`) và mã invite.
4. **Connect** — app gọi `POST /api/nodes/invites/redeem`, lấy gateway URL + token, rồi spawn CLI.
5. Duyệt **device + node** trên Companion Nodes.

Mã hết hạn sau **15 phút**, **dùng một lần**.

### Cách 2 — Gateway token (Phase 1)

1. Start gateway (`http://127.0.0.1:18789`).
2. Copy **gateway access token** từ AucoBot **Settings**.
3. Tab **Gateway token** → nhập URL + token → **Connect**.
4. Duyệt device + node trên Companion Nodes.

Optional: set **AucoBot dashboard URL** for a quick link to `/dashboard/nodes`.

## Data storage

| Data | Location |
|------|----------|
| Gateway URL, display name, dashboard URL | Encrypted via Electron `safeStorage` (when available) |
| Gateway token | Same encrypted config store (main process only) |
| Paired node identity | `~/.openclaw/node.json` (OpenClaw CLI) |
| Node registry / pairing state | OpenClaw **gateway** (AucoBot proxies RPC) |

No Postgres — the gateway is the source of truth.

## System tray

- Close window → hides to tray (macOS/Windows).
- Tray menu: show window, disconnect, quit.
- Optional **Launch at login** (starts hidden).

## WSL / remote gateway notes

- Run **OpenClaw Node** on the machine that should act as the node (your Mac/Windows desktop).
- Point **Gateway URL** at a reachable HTTP(S) base:
  - Local: `http://127.0.0.1:18789`
  - LAN: `http://192.168.x.x:18789`
  - WSL2: use the Windows host IP from WSL, or run gateway on Windows and connect from Windows app.
- Ensure firewall allows the gateway port.
- Token must match the gateway instance you approve in Companion Nodes.

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Dev mode (HMR + Electron) |
| `pnpm build` | Compile main/preload + Vite renderer |
| `pnpm start` | Run Electron after build |
| `pnpm typecheck` | TypeScript check |
| `pnpm dist:mac` / `pnpm dist:win` | Packaged installers |

## Architecture

- **Renderer:** Preact 10 + Vite + CSS Modules + Zod (UX validation)
- **Main:** config (`safeStorage`), IPC, tray, spawns OpenClaw CLI
- **Preload:** `contextBridge` → `window.nodeDevice`

See the project plan in the repo docs for future enhancements (cloud invite policies, auto-approve scopes).

## API (Phase 2)

| Endpoint | Auth | Description |
|----------|------|-------------|
| `POST /api/projects/:id/nodes/invites` | JWT | Create invite (returns code once) |
| `GET /api/projects/:id/nodes/invites` | JWT | List recent invites |
| `DELETE /api/projects/:id/nodes/invites/:inviteId` | JWT | Revoke invite |
| `POST /api/nodes/invites/redeem` | Public | Redeem code → gateway URL + token |
