# OpenClaw Backend

> **Control Plane API** for container orchestration, heavy task processing, and project management  
> **Stack:** NestJS · Fastify · PostgreSQL · Prisma · Redis · BullMQ

---

## Features

- ✅ Authentication (Better Auth: email/password, Google OAuth)
- ✅ Project management with container lifecycle
- ✅ Auto-idle detection with configurable timeouts (Free: 10min, Pro: 60min)
- ✅ Heavy job processing (FFmpeg, Playwright, TTS, STT) — Pro only
- ✅ Plan-based quotas (Free: 1 project, Pro: 10 projects + 100 heavy jobs/day)
- ✅ Async job queues with BullMQ + Redis
- ✅ Swagger API documentation at `/api/docs`
- ✅ Global error handling (503 for service unavailability)

---

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+ (or use Docker)
- Docker (optional, for running services)

### Installation

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database URL and secrets

# Run migrations (includes baseline Free/Pro `plans` rows; no `db seed` required for prod-like)
npx prisma migrate dev

# Optional: re-upsert plans if you change values manually
# npx prisma db seed
```

### Running the Server

```bash
# Development (watch mode)
npm run dev

# Production
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

**Server runs on:** `http://localhost:3001`  
**Swagger UI:** `http://localhost:3001/api/docs`

### Docker (API + Postgres + Redis + vps-worker)

```bash
cd backend
# Build: backend + vps-worker; ensure .env.docker exists (secrets / VPS_WORKER_SECRET, auth, …)
docker compose build
# If host port 3002 is already used (e.g. another worker), map another port:
#   set VPS_WORKER_PORT=3003   # Windows PowerShell: $env:VPS_WORKER_PORT="3003"
#   export VPS_WORKER_PORT=3003  # Linux/macOS
docker compose up -d
curl -s http://localhost:3001/health
curl -s http://localhost:${VPS_WORKER_PORT:-3002}/health   # vps-worker
```

`docker-compose.yml` pins local `DATABASE_URL` / `REDIS_URL` to the compose Postgres and Redis, sets `APP_DOMAIN` and `OPENCLAW_IMAGE`, and runs `vps-worker` on network `openclaw-net` for spawned containers.

---

## Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/openclaw"

# Redis (for BullMQ queue)
REDIS_URL="redis://localhost:6379"
# Or individual: REDIS_HOST, REDIS_PORT, REDIS_PASSWORD

# Auth
BETTER_AUTH_SECRET=<32-byte random hex>
GOOGLE_CLIENT_ID=<from Google OAuth console>
GOOGLE_CLIENT_SECRET=<from Google OAuth console>

# API
FRONTEND_URL="http://localhost:3000"
PORT=3001
NODE_ENV="development"

# VPS Worker (internal use)
VPS_WORKER_SECRET=<random secret for webhook auth>

# Projects & public URLs
# Public hostname suffix for each project: https://<slug>.<APP_DOMAIN> (no https://, no path)
APP_DOMAIN=clawsandbox.cloud
# Image used when spawning user containers; change this to roll out a new build
OPENCLAW_IMAGE=ghcr.io/yourorg/openclaw:latest
```

**DNS (production):** point a wildcard `*.clawsandbox.cloud` (or your `APP_DOMAIN`) to the IP where Traefik + the vps-worker host run, so `https://<slug>.<APP_DOMAIN>` resolves. For quick checks without public DNS, use e.g. `curl --resolve myslug.clawsandbox.cloud:443:<vps-ip> https://myslug.clawsandbox.cloud/health`.

#### Local multi-project test

- Run Postgres, Redis, backend, and vps-worker against the same Bull queue and Docker socket.
- Create two projects with `POST /api/projects` and distinct `displayName` values. Confirm the worker created two containers named `openclaw-<slug>`.
- `PATCH /api/projects/:id` with `{ "displayName": "new label" }` should not change the slug, container name, or Traefik host; `GET /api/projects/mine` should still show the same `subdomain` and `publicUrl` host.

---

## Database Setup

### Initial Migration

```bash
# Create database and run initial migration
npx prisma migrate dev --name init
```

### Seed Data (optional)

By default, Free/Pro `plans` are inserted by migration `20260426140000_baseline_plans` when you run `migrate dev` / `migrate deploy`. Use this only to **re-upsert** plan rows (same logic as the migration):

```bash
npx prisma db seed
```

**Subscriptions:** On sign-up, Better Auth runs a hook that creates an `ACTIVE` `subscriptions` row for the `free` plan. Existing users without a row are fixed by migration `20260426160000_backfill_free_subscriptions`. `PlanGateService` always resolves the current plan from that subscription (no implicit free fallback).

### Reset (local development only)

```bash
npx prisma migrate reset
```

---

## Testing

### Unit Tests

```bash
npm run test
npm run test:watch
npm run test:cov
```

### E2E Tests

```bash
npm run test:e2e
```

### Manual Testing

Use Swagger UI at `/api/docs` to test endpoints with authentication.

---

## API Endpoints

### Authentication (Better Auth)

- `POST /api/auth/sign-up/email` — Create account
- `POST /api/auth/sign-in/email` — Login (returns Better Auth session cookie)
- `POST /api/auth/sign-out` — Logout
- `GET /api/auth/get-session` — Check current session
- `GET /api/auth/sign-in/social?provider=google` — Google OAuth

### Projects

- `GET /api/projects/mine` — List my projects
- `POST /api/projects` — Create project (body: `displayName`; server generates unique slug and `publicUrl`)
- `PATCH /api/projects/:id` — Update `displayName` only
- `POST /api/projects/:id/start` — Start container
- `POST /api/projects/:id/stop` — Stop container
- `GET /api/projects/:id/health` — Get status
- `GET /api/projects/:id/instances` — Instance history
- `DELETE /api/projects/:id` — Delete project

### Heavy Jobs (Pro only)

- `POST /api/heavy/submit` — Submit FFmpeg/Playwright/TTS/STT job
- `GET /api/heavy/status/:jobId` — Get job status
- `GET /api/heavy/results/:jobId` — Download result
- `POST /api/heavy/cancel/:jobId` — Cancel job
- `GET /api/heavy/history` — Job history

### Internal

- `POST /api/internal/heartbeat` — Keep container awake
- `POST /api/internal/status` — Update container status
- `POST /api/internal/trigger-idle-detection` — Manual idle check

---

## Project Structure

```
src/
├── auth/              # Authentication logic
├── projects/          # Project CRUD & lifecycle
├── heavy-jobs/        # Heavy task processing
├── queue/             # BullMQ integration
├── scheduler/         # Idle detection cron
├── internal/          # Internal APIs
├── subscriptions/     # Plans & quotas
├── prisma/            # Database service
├── common/
│   ├── filters/       # Global error handling
│   ├── middleware/    # Database health check
│   ├── interceptors/  # Response formatting
│   └── guards/        # SessionGuard, etc.
└── main.ts            # App bootstrap
```

---

## Error Handling

The API returns structured error responses:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "CONFLICT",
    "message": "Daily heavy job limit (100) reached"
  }
}
```

### Common Status Codes

- `200` — Success
- `400` — Bad request (validation error)
- `401` — Unauthorized (no session)
- `403` — Forbidden (plan limit, ownership)
- `404` — Not found
- `409` — Conflict (already exists, quota reached)
- `503` — Service unavailable (DB/Redis down)
- `504` — Gateway timeout

---

## Resilience

### Database Unavailability

If PostgreSQL is down:

- Health check middleware detects it every 5 seconds
- Subsequent requests return `503 Service Unavailable`
- Automatic recovery when database comes back online

### Queue Unavailability

If Redis is down:

- Heavy job submission returns `503 Service Unavailable`
- Other endpoints continue working
- Jobs are queued when Redis recovers

### Timeouts

- Internal API calls: 5s timeout
- Queue job processing: 5min timeout (FFmpeg) / 2min (Playwright, TTS) / 5min (STT)
- Failed jobs retry with exponential backoff

---

## Development Tips

### Hot Reload

Use `npm run dev` for automatic reload on file changes.

### Debugging

```bash
npm run start:debug
# Then attach debugger to port 9229
```

### Database Inspection

```bash
# Open Prisma Studio
npx prisma studio
```

### Queue Monitoring

```bash
# View Redis queue stats
redis-cli
KEYS openclaw:*
LRANGE openclaw:heavy:queue 0 -1
```

---

## Docker & Deploy

### Test backend bằng Docker (local)

Muc tieu: chay full stack backend local bang Docker gom `backend + postgres + redis`.

#### 1) Chuan bi

- Dang dung file `docker-compose.yml` trong thu muc `backend/`
- Service app dung image da build tay: `clawsaas-be:dev`
- Da co `.env.docker` (chua secret cho auth/oauth)

#### 2) Build tay image backend

```bash
cd backend
docker build -t clawsaas-be:dev .
```

#### 3) Dung compose

```bash
docker compose up -d
```

Compose se tao:

- Container: `clawsaas-api`, `clawsaas-postgres`, `clawsaas-redis`
- Volumes: `clawsaas-postgres-data`, `clawsaas-redis-data`

#### 4) Kiem tra trang thai

```bash
docker compose ps
docker compose logs -f backend
```

Backend san sang khi thay log:

- `Nest application successfully started`
- `Listening on http://127.0.0.1:3001`

Truy cap:

- API: `http://localhost:3001`
- Swagger: `http://localhost:3001/api/docs`

> Luu y: `localhost:5432` va `localhost:6379` la cong DB/Redis protocol, khong phai web URL nen khong mo bang browser.

#### 5) Mo Prisma Studio dung DB Docker

`prisma.config.ts` doc `DATABASE_URL` tu environment hien tai, vi vay phai set URL local truoc khi chay.

**Windows CMD:**

```cmd
set DATABASE_URL=postgresql://postgres:password@localhost:5432/openclaw
npx prisma studio --port 5555
```

**PowerShell:**

```powershell
$env:DATABASE_URL="postgresql://postgres:password@localhost:5432/openclaw"
npx prisma studio --port 5555
```

Mo: `http://localhost:5555`

#### 6) Khi sua code backend

Vi compose dang dung image build tay, can build lai moi khi code thay doi:

```bash
docker build -t clawsaas-be:dev .
docker compose up -d --force-recreate backend
```

#### 7) Dung, xoa, va reset du lieu

```bash
# Dung stack (giu data)
docker compose down

# Dung stack va xoa ca volumes (mat data)
docker compose down -v

# Xem volumes
docker volume ls
docker volume inspect clawsaas-postgres-data
docker volume inspect clawsaas-redis-data
```

#### 8) Loi thuong gap

- `failed to read dockerfile`: ban dang chay lenh o root repo. Hay `cd backend` truoc khi build/compose.
- Khong thay bang trong Prisma Studio: dang tro sai `DATABASE_URL` (thuong dang tro cloud DB).
- Khong vao duoc `http://localhost:5432`: day khong phai HTTP endpoint.

### Build và push lên Docker Hub

Dùng script `deploy.ps1` (Windows PowerShell):

```powershell
# Lần đầu — unlock script nếu bị báo lỗi
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

# Build + push version mới lên DọckerHub
.\deploy.ps1 1.0.0
```

Script tự động:

1. Build image `mankhb2k/clawsaas-be:1.0.0`
2. Push tag version lên Docker Hub
3. Tag thêm `latest` và push

### Deploy lên Railway

**Kiến trúc:**

```
Railway
├── Backend (Docker image từ Hub)   ← deploy ở đây
└── Redis (Railway plugin)          ← add service 1-click

Neon (cloud riêng)
└── PostgreSQL                      ← kết nối qua DATABASE_URL
```

**Các bước:**

1. Tạo project trên [railway.app](https://railway.app)
2. **Add Service → Redis** (Railway plugin)
3. **Add Service → Docker Image** → nhập `mankhb2k/clawsaas-be:latest`
4. Vào tab **Variables**, thêm:

```
DATABASE_URL              = (Neon connection string)
REDIS_URL                 = (copy từ Redis service vừa tạo)
BETTER_AUTH_SECRET = (random 32 chars)
FRONTEND_URL       = https://your-frontend.vercel.app
VPS_WORKER_SECRET  = (random secret)
API_URL            = https://your-backend.railway.app
NODE_ENV           = production
```

5. Railway tự pull image → chạy `prisma migrate deploy` → start server
6. Vào **Settings → Networking → Generate Domain** để lấy URL

### Update phiên bản mới

```powershell
# Sửa code → build → push version mới
.\deploy.ps1 1.0.1
```

Sau đó vào Railway → service → **Deploy** để pull `latest` về chạy.

### Test image locally trước khi deploy

```powershell
docker run -p 3001:3001 `
  -e DATABASE_URL="your_neon_url" `
  -e REDIS_URL="redis://host.docker.internal:6379" `
  -e BETTER_AUTH_SECRET="abc123..." `
  -e NODE_ENV=production `
  mankhb2k/clawsaas-be:latest
```

---

## Production Checklist

- [ ] Database backups configured
- [ ] Redis persistence enabled
- [ ] Environment secrets secured
- [ ] Rate limiting configured
- [ ] Logging and monitoring set up
- [ ] Error tracking (Sentry, etc.)
- [ ] Database migrations tested on staging
- [ ] All endpoints tested and documented
- [ ] Security headers configured
- [ ] CORS properly scoped

---

## Support

For issues and questions, check:

- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [BullMQ Docs](https://docs.bullmq.io)
