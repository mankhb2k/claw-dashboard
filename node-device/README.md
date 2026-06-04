# OpenClaw Node Device

Desktop companion node for OpenClaw — wraps the OpenClaw CLI (`openclaw node run`) and connects to your gateway as a **node** role device. Pair and manage nodes from the AucoBot dashboard (**Companion Nodes**).

Standalone package (not part of the `aucobot/` monorepo).

## Requirements

- **Electron 40+** (nhúng **Node.js 24** — đủ cho OpenClaw CLI khi không có `node` trên PATH)
- **Node.js 22.19+** trên PATH (tùy chọn; dev/build scripts)
- **pnpm**
- Running **OpenClaw gateway** (e.g. `pnpm dev:runtime` in AucoBot OSS)
- **Mã pairing** từ AucoBot **Companion Nodes** (tạo trên dashboard)

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

## Pairing flow (invite only)

1. Trên AucoBot **Companion Nodes**, bấm **Tạo mã pairing** và copy mã `nd-inv-…`.
2. Trong OpenClaw Node, bật toggle kết nối → nhập **URL dashboard** và **mã pairing**.
3. **Kết nối** — app gọi `POST /api/nodes/invites/redeem`, lấy gateway URL + token (lưu nội bộ, không nhập tay), rồi spawn CLI.
4. Duyệt **device + node** trên Companion Nodes khi app báo chờ duyệt.

Mã hết hạn sau **15 phút**, **dùng một lần**. Lần sau có thể bật toggle để **reconnect** bằng phiên đã lưu (không cần mã mới nếu chưa xóa pairing).

Tùy chọn: **Launch at login** trong Settings (khởi động minimized vào system tray).

## Data storage

| Data | Location |
|------|----------|
| Gateway URL, display name, dashboard URL | Encrypted via Electron `safeStorage` (when available) |
| Gateway token (sau redeem invite) | Same encrypted config store (main process only — không hiển thị UI) |
| Paired node identity | `~/.openclaw/node.json` (OpenClaw CLI) |
| Node registry / pairing state | OpenClaw **gateway** (AucoBot proxies RPC) |

No Postgres — the gateway is the source of truth.

## System tray

- Close window → hides to tray (macOS/Windows).
- Tray menu: show window, disconnect, quit.
- Optional **Launch at login** (starts hidden).

## WSL / remote gateway notes

- Run **OpenClaw Node** on the machine that should act as the node (your Mac/Windows desktop).
- Gateway URL được gán tự động khi redeem invite (OSS thường `http://127.0.0.1:18789`).
- LAN / WSL2: đảm bảo gateway reachable từ máy chạy app; firewall mở đúng port.

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

### "OpenClaw CLI failed to run" / yêu cầu Node 22.19+

Electron **35** nhúng Node ~22.16 (không đủ OpenClaw). Dùng **Electron 40+** (Node 24) hoặc cài **Node 22.19+** trên PATH:

```bash
node -v   # phải >= v22.19.0
```

**Khắc phục:**

1. Cài [Node.js 22 LTS](https://nodejs.org) (hoặc `nvm install 22 && nvm use 22`).
2. Đóng hết cửa sổ AucoBot Node, mở lại `pnpm dev` hoặc app đã build.
3. Nếu có nhiều bản Node: đặt `OPENCLAW_NODE=C:\path\to\node.exe` rồi khởi động lại app.
4. Trong `node-device`: `pnpm install` (đảm bảo có `node_modules/openclaw`).

Redeem invite vẫn có thể thành công; lỗi xuất hiện khi spawn `openclaw node run`.

## Architecture

- **Renderer:** Preact 10 + Vite + CSS Modules + Zod (UX validation)
- **Main:** config (`safeStorage`), IPC, tray, spawns OpenClaw CLI
- **Preload:** `contextBridge` → `window.nodeDevice`

## API (invite redeem)

| Endpoint | Auth | Description |
|----------|------|-------------|
| `POST /api/projects/:id/nodes/invites` | JWT | Create invite (dashboard) |
| `POST /api/nodes/invites/redeem` | Public | Redeem code → gateway URL + token |
