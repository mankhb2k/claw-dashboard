# OpenClaw Backend

> **Control Plane API** for container orchestration, heavy task processing, and project management  
> **Stack:** NestJS · Fastify · PostgreSQL · Prisma · Redis · BullMQ

---

## Features

- ✅ Authentication (email/password, Google OAuth)
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

# Run migrations
npx prisma migrate dev

# Seed plans (Free & Pro)
npx prisma db seed
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
```

---

## Database Setup

### Initial Migration

```bash
# Create database and run initial migration
npx prisma migrate dev --name init
```

### Seed Data

```bash
# Seed Free & Pro plans
npx prisma db seed
```

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

### Authentication
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Login (returns session cookie)
- `POST /api/auth/logout` — Logout
- `GET /api/auth/session` — Check current session
- `GET /api/auth/sign-in/google` — Google OAuth
- `GET /api/auth/callback/google` — OAuth callback

### Projects
- `GET /api/projects/mine` — List my projects
- `POST /api/projects` — Create project
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
