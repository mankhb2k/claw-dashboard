# OSS deploy — full stack

Mục tiêu: **một lệnh** dựng 4 service + volume dùng chung.

| Service | Port | Image |
| ------- | ---- | ----- |
| `postgres` | 5432 | `postgres:16-alpine` |
| `api` | 8387 | Hub `claw-dashboard/api` (pull) · hoặc `--build api` |
| `web` | 8386 | Hub `claw-dashboard/web` (pull) · hoặc `--build web` |
| `gateway` | 18789 | `alpine/openclaw:latest` |

Volume **`openclaw_data`**: API ghi `/data/projects/default/…` (OSS), gateway đọc cùng dữ liệu.

File compose: [`docker-compose.yml`](./docker-compose.yml)

## Quick start — pull Hub (khuyến nghị)

Images: https://hub.docker.com/u/claw-dashboard

```powershell
cd studio
copy deploy\.env.example deploy\.env
# Sửa JWT_SECRET, OPENCLAW_GATEWAY_TOKEN, POSTGRES_PASSWORD trong deploy\.env

docker compose -f deploy/docker-compose.yml pull
docker compose -f deploy/docker-compose.yml up -d
```

Mở http://localhost:8386 → đăng nhập **`admin` / `admin123`** → tạo project lần đầu.

## Build api/web từ source (dev)

```powershell
docker compose -f deploy/docker-compose.yml up -d --build api web
```

Gateway chờ `openclaw.json` trong volume rồi bind `:18789`.

## Dev local (không full stack)

| File | Mục đích |
| ---- | -------- |
| `docker-compose.postgres.dev.yml` | Chỉ Postgres |
| `docker-compose.gateway.dev.yml` | Gateway dev |
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
| `OPENCLAW_DATA_ROOT` | Trong compose: `/data/projects` |
| `CLAW_DASHBOARD_IMAGE_TAG` | Tag Hub cho api/web (mặc định `latest`) |
| `NEXT_PUBLIC_API_URL` | URL API từ trình duyệt (khi `--build web`) |

## Lệnh hữu ích

```powershell
docker compose -f deploy/docker-compose.yml ps
docker compose -f deploy/docker-compose.yml logs -f api gateway
curl.exe http://127.0.0.1:18789/healthz
curl.exe http://127.0.0.1:8387/api/health
docker compose -f deploy/docker-compose.yml down
```

## Ghi chú

- API **không** mount `docker.sock` (OSS only).
- MCP connectors chạy stdio qua gateway (`npx` community packages) — xem [`../../mcp.md`](../../mcp.md).
