# Backend — Auth API (JWT)

NestJS + Fastify + Prisma (Postgres). **Đăng ký / đăng nhập / refresh token / JWT Bearer** (`/api/auth/*`).

## Env

Copy `.env.example` → `.env` và chỉnh giá trị.

Bắt buộc local:

- `DATABASE_URL`
- `JWT_SECRET` (production)

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

**Breaking:** migration cũ (projects / workspace / secrets) đã gỡ. Database đã từng migrate bản cũ: dùng DB mới hoặc `npx prisma migrate reset` (mất dữ liệu).

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

## Endpoints

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/register` | — |
| POST | `/api/auth/login` | — |
| POST | `/api/auth/refresh` | — |
| GET | `/api/auth/me` | Bearer |
| GET | `/api/health` | — |
