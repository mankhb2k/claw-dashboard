# OSS deploy — full stack

Mục tiêu: **một lệnh** dựng 4 service + volume dùng chung (Supabase-style).

| Service | Port | Image |
| ------- | ---- | ----- |
| `postgres` | 5432 | `postgres:16-alpine` |
| `api` | 8387 | build `Dockerfile.api` |
| `web` | 8386 | build `Dockerfile.web` |
| `gateway` | 18789 | `alpine/openclaw:latest` (official release, Docker Hub mirror) |

Volume **`openclaw_data`**: API ghi `/data/projects/{projectId}/…`, gateway đọc cùng dữ liệu.

## Quick start

```powershell
cd aucobot
copy deploy\.env.example deploy\.env
# Sửa JWT_SECRET, OPENCLAW_GATEWAY_TOKEN, POSTGRES_PASSWORD trong deploy\.env

docker compose -f deploy/docker-compose.yml up -d --build
```

Mở http://localhost:8386 → đăng nhập (`SELF_HOST_USER_*`) → tạo project lần đầu.

Gateway **chờ** đến khi có `openclaw.json` trong volume (script `scripts/gateway-entrypoint.sh`), sau đó tự bind `:18789`.

## Dev local (không full stack)

| File | Mục đích |
| ---- | -------- |
| `docker-compose.deps.yml` | Chỉ Postgres |
| `docker-compose.gateway.dev.yml` | Gateway + bind project folder legacy |

```powershell
pnpm dev:deps
docker compose -f deploy/docker-compose.gateway.dev.yml --env-file deploy/.env.gateway up -d
pnpm dev   # api + web trên host
```

## Env quan trọng

| Biến | Ghi chú |
| ---- | ------- |
| `OPENCLAW_GATEWAY_TOKEN` | Khớp giữa `api` và `gateway` |
| `OPENCLAW_DATA_ROOT` | Trong compose: `/data/projects` (cả api + gateway) |
| `OSS_PROJECT_ID` | Tuỳ chọn — pin một project; để trống = auto project đầu tiên |
| `NEXT_PUBLIC_API_URL` | URL API **từ trình duyệt** (build-time cho web) |

## Lệnh hữu ích

```powershell
docker compose -f deploy/docker-compose.yml ps
docker compose -f deploy/docker-compose.yml logs -f api gateway
curl.exe http://127.0.0.1:18789/healthz
curl.exe http://127.0.0.1:8387/api/health
docker compose -f deploy/docker-compose.yml down
```

## Ghi chú

- API **không** mount `docker.sock` (OSS mode).
- Cloud spawn / per-project container: `RUNTIME_MODE=cloud` — `cloud/api` + `cloud/deploy`.
- Chi tiết kiến trúc: `docs/monorepoplan.md` §9.
