# Backend Workflow — OpenClaw SaaS

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | NestJS v11 + Fastify |
| Language | TypeScript v6 |
| Database | PostgreSQL + Prisma v7 |
| Queue | Redis + Bull |
| Auth | Session cookie + Google OAuth |
| Validation | class-validator + class-transformer |
| Scheduling | @nestjs/schedule (cron) |
| Testing | Jest + Supertest |

---

## Directory Structure

```
backend/src/
├── auth/           # Session auth, Google OAuth, password hashing
├── projects/       # Project CRUD + container lifecycle
├── heavy-jobs/     # Computational job submission & tracking
├── queue/          # Bull queue setup, consumer, mock worker
├── subscriptions/  # Plan/subscription queries
├── scheduler/      # Cron: idle project auto-stop
├── internal/       # VPS-to-backend API (worker secret auth)
├── prisma/         # PrismaService (database client)
└── common/         # Shared decorators, filters, interceptors, guards
```

---

## Authentication Flow

```
POST /api/auth/register | /api/auth/login
  → AuthService: validate credentials (scrypt)
  → Create Session (30-day expiry, DB record)
  → Set HttpOnly cookie: session_token
  → Return user object

GET <protected route> with cookie
  → SessionGuard: read cookie → lookup Session table → inject @CurrentUser

Google OAuth:
  GET /api/auth/sign-in/google → redirect Google
  GET /api/auth/callback/google → exchange code → upsert User + Account → create Session
```

**Password hashing:** scrypt KDF, 16-byte random salt, 64-byte derived key, timing-safe compare.

**Worker auth:** `Authorization: Bearer <VPS_WORKER_SECRET>` header, validated by `WorkerSecretGuard`.

---

## Project Lifecycle (State Machine)

```
CREATING → RUNNING → STOPPED → STARTING → RUNNING
                   ↘ ERROR

Actions:
  POST /api/projects             → create (status: CREATING)
  POST /api/projects/:id/start   → wake   (STOPPED → STARTING)
  POST /api/projects/:id/stop    → stop   (RUNNING → STOPPED)
  DELETE /api/projects/:id       → delete (must be STOPPED)
```

### Container Spawn Flow
```
ProjectsService.create()
  → check plan quota (free: 1 project)
  → generate unique subdomain (nanoid)
  → INSERT Project (CREATING) + ContainerInstance (STARTING)
  → QueueService.enqueueSpawn() → 'container-ops' queue, priority 5
  ↓
QueueConsumerService (dev: mock worker)
  → simulate work
  → POST /api/internal/status { projectId, status: RUNNING }
  → Project updated to RUNNING
```

### Idle Detection (Cron: every 1 minute)
```
IdleDetectionService.detectAndStopIdleProjects()
  → query all RUNNING projects
  → compare lastActiveAt vs plan.idleTimeoutMin
     • Free plan:  10 min timeout
     • Pro plan:   60 min timeout
  → auto-stop idle projects → enqueue 'stop' job
```

---

## Heavy Jobs Flow

**Supported tools:** `FFMPEG` | `PLAYWRIGHT` | `TTS` | `STT`

**Access control:** Pro plan only. Free plan → rejected. Daily quota: 100 jobs/day.

```
POST /api/heavy/submit { projectId, tool, params }
  → verify project ownership
  → check plan + daily quota
  → INSERT HeavyJob (PENDING, expires 30 days)
  → QueueService.enqueueHeavyJob() → 'heavy-tasks' queue
     Timeouts: FFMPEG 5min | PLAYWRIGHT 2min | TTS 30s | STT 5min

Job processing:
  → Worker picks job from queue
  → Process (or mock in dev)
  → HeavyJobsService.updateJobResult(DONE | FAILED)

GET /api/heavy/status/:jobId   → status, submittedAt, completedAt
GET /api/heavy/results/:jobId  → resultPath, resultSizeMb (DONE only)
POST /api/heavy/cancel/:jobId  → PENDING or PROCESSING → CANCELLED
GET /api/heavy/history         → all jobs for current user
```

---

## Queue System (Redis + Bull)

| Queue | Jobs | Priority |
|-------|------|----------|
| `container-ops` | spawn (5), wake (1), stop (10), destroy (5) | numeric, lower = higher |
| `heavy-tasks` | ffmpeg, playwright, tts, stt | FIFO with timeout |

**Dev mock worker** (`NODE_ENV !== 'production'`): simulates VPS responses by calling `/api/internal/status` with `VPS_WORKER_SECRET`, with ~1s artificial delay.

---

## API Routes

### Auth
| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/register` | None |
| POST | `/api/auth/login` | None |
| POST | `/api/auth/logout` | Cookie |
| GET  | `/api/auth/session` | Cookie |
| GET  | `/api/auth/sign-in/google` | None |
| GET  | `/api/auth/callback/google` | None |

### Projects
| Method | Path | Auth |
|--------|------|------|
| GET    | `/api/projects/mine` | Cookie |
| POST   | `/api/projects` | Cookie |
| POST   | `/api/projects/:id/start` | Cookie |
| POST   | `/api/projects/:id/stop` | Cookie |
| GET    | `/api/projects/:id/health` | Cookie |
| GET    | `/api/projects/:id/instances` | Cookie |
| DELETE | `/api/projects/:id` | Cookie |

### Heavy Jobs
| Method | Path | Auth |
|--------|------|------|
| POST | `/api/heavy/submit` | Cookie |
| GET  | `/api/heavy/status/:jobId` | Cookie |
| GET  | `/api/heavy/results/:jobId` | Cookie |
| POST | `/api/heavy/cancel/:jobId` | Cookie |
| GET  | `/api/heavy/history` | Cookie |

### Internal (VPS → Backend)
| Method | Path | Auth |
|--------|------|------|
| POST | `/api/internal/status` | Worker secret |
| POST | `/api/internal/heartbeat` | Worker secret |
| POST | `/api/internal/trigger-idle-detection` | Worker secret |

---

## Database Models (Prisma)

| Model | Purpose |
|-------|---------|
| `User` | User accounts |
| `Account` | Auth credentials (email/google) |
| `Session` | Active session tokens |
| `Plan` | Subscription tiers (free/pro) |
| `Subscription` | User ↔ Plan binding |
| `Invoice` | Billing records |
| `Project` | Containerized apps per user |
| `ContainerInstance` | History of each container start/stop |
| `HeavyJob` | Computational task records |

---

## Request Lifecycle

```
HTTP Request
  → Fastify (CORS, cookie parse)
  → NestJS Router
  → Guard (SessionGuard / WorkerSecretGuard)
  → ValidationPipe (DTO transform + whitelist)
  → Middleware (DbHealthMiddleware)
  → Controller method
  → Service (business logic + Prisma)
  → [Optional] QueueService → Redis
  → ResponseInterceptor → { success, data, error }
  → JSON response
```

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL (Neon pooled) |
| `REDIS_URL` | Redis queue backend |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth |
| `FRONTEND_URL` | CORS origin + OAuth redirect |
| `VPS_WORKER_SECRET` | Bearer token for internal API |
| `API_URL` | Backend base URL (for internal callbacks) |

---

## Dev Commands

```bash
npm run dev          # watch mode
npm run build        # compile TypeScript → dist/
npm run start:prod   # node dist/src/main
npm run test         # Jest unit tests
npm run test:cov     # coverage report
npx prisma migrate dev   # apply migrations
npx prisma db seed       # seed plans
```

---

## Plan Limits

| Feature | Free | Pro |
|---------|------|-----|
| Max projects | 1 | 10 |
| RAM | 1 GB | 2 GB |
| vCPU | 0.5 | 1 |
| Heavy jobs/day | 0 | 100 |
| Idle timeout | 10 min | 60 min |
