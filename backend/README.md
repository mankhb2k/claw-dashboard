# Backend — Phase 1 (OSS control plane)

NestJS + Fastify + Prisma (Postgres). **JWT** auth, **projects**, **workspace revisions** (JSON file bundle), **encrypted project secrets**.

## Env

Copy `.env.example` → `.env` và chỉnh giá trị.

Bắt buộc local:

- `DATABASE_URL`
- `JWT_SECRET` (production)
- `PROJECT_SECRETS_MASTER_KEY` (production) — 64 hex hoặc base64 32 byte

Tuỳ chọn:

- `JWT_ACCESS_SECONDS` — TTL access token (mặc định 900)
- `JWT_REFRESH_DAYS` — refresh token (mặc định 7)
- `FRONTEND_URL` — CORS
- `PORT` — mặc định 3001

## DB

```bash
docker compose -f docker-compose.deps.yml up -d   # chỉ cần postgres
npx prisma migrate deploy
# hoặc dev: npx prisma migrate dev
```

**Lưu ý:** migration `20260520120000_phase1_init` tạo schema mới. Nếu DB cũ đã có bảng legacy, cần DB mới hoặc `DROP` thủ công trước khi migrate.

Seed (tuỳ chọn):

```bash
npx prisma db seed
# SEED_USER_EMAIL / SEED_USER_PASSWORD
```

## Chạy

```bash
npm install
npx prisma generate
npm run dev
```

- API: `http://localhost:3001/api`
- Swagger: `http://localhost:3001/api/docs`

## Endpoints (tóm tắt)

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/register` | — |
| POST | `/api/auth/login` | — |
| POST | `/api/auth/refresh` | — |
| GET | `/api/auth/me` | Bearer |
| GET | `/api/health` | — |
| CRUD | `/api/projects/*` | Bearer |
| POST | `/api/projects/:id/workspace` | Bearer |
| GET | `/api/projects/:id/workspace/latest` | Bearer |
| GET | `/api/projects/:id/workspace/revisions` | Bearer |
| `/api/projects/:id/secrets` | list / put / get / delete | Bearer |

Phase 2 (billing, queue, worker callbacks) **không** có trong codebase này.
