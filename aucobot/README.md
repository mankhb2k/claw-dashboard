# AucoBot

Control plane OSS for OpenClaw — NestJS API, Next.js dashboard, workspace sync, chat proxy.

**Related repos (sibling checkout for full stack):**

| Repo | Clone |
| ---- | ----- |
| **aucobot** (this) | `git@github.com:aucobot/aucobot.git` |
| **mcp** (hosted connectors) | `git@github.com:aucobot/mcp.git` → clone as `../mcp` |
| **node-device** (companion desktop) | `git@github.com:aucobot/node-device.git` |

```text
workspace/
├── aucobot/      ← this repo
├── mcp/          ← required for docker compose MCP service
└── node-device/  ← optional Electron companion
```

Monorepo mới nằm **song song** với code legacy ở parent (nếu bạn vẫn dùng `openclaw-saas` meta-repo):

| Legacy (giữ nguyên) | Monorepo mới |
| ------------------- | ------------ |
| `../backend/` | `apps/api/` |
| `../frontend/` | `apps/web/` |
| `../openclaw-worker/` | **pull image** `openclaw-worker:*` (không copy vào monorepo) |
| `../skill-hub/` | `catalogs/skill-hub/` |

**Upstream pull (không build trong repo):** `postgres:16-alpine`, `openclaw-worker:latest` — cấu hình qua `deploy/docker-compose.yml` và `OPENCLAW_IMAGE`.

**Ưu tiên:** OSS self-host (gateway cố định `:18789`, không spawn Docker khi tạo project).  
**Cloud:** `cloud/{api,web,packages,deploy}` — implement sau.

## Trạng thái

- [x] Cấu trúc folder + copy code OSS (`apps/api`, `apps/web`)
- [x] `pnpm install` + build API
- [x] `RUNTIME_MODE=oss` — không spawn Docker khi tạo project
- [x] Gateway dev `:18789` + `deploy/docker-compose.gateway.dev.yml`
- [x] Compose OSS 4 service — `deploy/docker-compose.yml`
- [x] Tách `cloud/` + flatten `deploy/`; bỏ `workers/openclaw` (gateway = pull image)
- [ ] E2E full stack compose (web → api → gateway → chat)
- [ ] Xóa legacy (`../backend`, `../frontend`) — **chỉ khi bạn xác nhận app mới chạy đúng**

## Dev local

**Yêu cầu:** Node 22+, pnpm 9+, Postgres, Docker (gateway image).

```bash
cd aucobot
pnpm install
cp .env.example .env   # single env at repo root (API + Web)
pnpm dev:deps     # Postgres nếu chưa có :5432

docker compose -f deploy/docker-compose.gateway.dev.yml --env-file deploy/.env.gateway up -d
pnpm dev          # api :8387 + web :8386
```

Full stack (cần sibling `../mcp`):

```bash
git clone git@github.com:aucobot/mcp.git ../mcp
docker compose -f deploy/docker-compose.yml up -d --build
```

Chi tiết: `docs/monorepoplan.md` · Sơ đồ luồng: `docs/monorepo-diagram.md` · AI agents: [`AGENTS.md`](./AGENTS.md)
