# OSS deploy — full stack

Mục tiêu: **một lệnh** dựng 5 service + volume dùng chung (Supabase-style).

| Service | Port | Image |
| ------- | ---- | ----- |
| `postgres` | 5432 | `postgres:16-alpine` |
| `api` | 8387 | Hub `aucobot/api` (pull) · hoặc `--build api` |
| `web` | 8386 | Hub `aucobot/web` (pull) · hoặc `--build web` |
| `mcp` | 8388 | Hub `aucobot/mcp` — **pull only**, không build |
| `gateway` | 18789 | `alpine/openclaw:latest` |

Volume **`openclaw_data`**: API ghi `/data/projects/default/…` (OSS), gateway đọc cùng dữ liệu.

File compose duy nhất: [`docker-compose.yml`](./docker-compose.yml)

## Quick start — pull Hub (khuyến nghị)

Images: https://hub.docker.com/u/aucobot

```powershell
cd aucobot
copy deploy\.env.example deploy\.env
# Sửa JWT_SECRET, OPENCLAW_GATEWAY_TOKEN, POSTGRES_PASSWORD trong deploy\.env

docker compose -f deploy/docker-compose.yml pull
docker compose -f deploy/docker-compose.yml up -d
```

Pin tag (tuỳ chọn):

```powershell
$env:AUCOBOT_IMAGE_TAG="latest"
docker compose -f deploy/docker-compose.yml pull
docker compose -f deploy/docker-compose.yml up -d
```

Mở http://localhost:8386 → đăng nhập **`admin` / `admin123`** → tạo project lần đầu.

**Cập nhật image mới:**

```powershell
docker compose -f deploy/docker-compose.yml pull
docker compose -f deploy/docker-compose.yml up -d
```

## Build api/web từ source (dev)

MCP **luôn pull Hub** — không cần clone repo `mcp` cho compose:

```powershell
docker compose -f deploy/docker-compose.yml up -d --build api web
docker compose -f deploy/docker-compose.yml pull mcp
docker compose -f deploy/docker-compose.yml up -d mcp
```

Gateway **chờ** đến khi có `openclaw.json` trong volume (script `scripts/gateway-entrypoint.sh`), sau đó tự bind `:18789`.

## Dev local (không full stack)

| File | Mục đích |
| ---- | -------- |
| `docker-compose.postgres.dev.yml` | Chỉ Postgres |
| `docker-compose.gateway.dev.yml` | Gateway + bind project folder legacy |
| `docker-compose.runtime.yml` | Postgres + gateway |

```powershell
pnpm dev:db
docker compose -f deploy/docker-compose.gateway.dev.yml --env-file deploy/.env.gateway up -d
pnpm dev   # api + web trên host
```

## Env quan trọng

| Biến | Ghi chú |
| ---- | ------- |
| `OPENCLAW_GATEWAY_TOKEN` | Khớp giữa `api` và `gateway` |
| `OPENCLAW_DATA_ROOT` | Trong compose: `/data/projects` (cả api + gateway) |
| `OSS_PROJECT_ID` | **Deprecated** — OSS dùng cố định `default/`. Chỉ dùng khi dev pin folder legacy. |
| `MCP_SERVICE_SECRET` | Khớp giữa `api` và `mcp` |
| `AUCOMCP_BASE_URL` | `http://mcp:8388` trong compose |
| `AUCOBOT_IMAGE_TAG` | Tag Hub cho api/web/mcp (mặc định `latest`) |
| `NEXT_PUBLIC_API_URL` | URL API **từ trình duyệt** (chỉ khi `--build web`) |

## Lệnh hữu ích

```powershell
docker compose -f deploy/docker-compose.yml ps
docker compose -f deploy/docker-compose.yml logs -f api gateway mcp
curl.exe http://127.0.0.1:8388/healthz
curl.exe http://127.0.0.1:18789/healthz
curl.exe http://127.0.0.1:8387/api/health
docker compose -f deploy/docker-compose.yml down
```

## Ghi chú

- API **không** mount `docker.sock` (OSS mode).
- `mcp` service: **pull only** từ `docker.io/aucobot/mcp`.
- `api` / `web`: pull mặc định; thêm `--build api web` khi dev.
- Chi tiết kiến trúc: `docs/monorepoplan.md` §2.
