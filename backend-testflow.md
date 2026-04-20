# Backend Development & Test Flow Plan

> **Stack:** NestJS · Fastify · PostgreSQL · Prisma · Redis · BullMQ  
> **Target:** MVP with Auth + Projects + Container Orchestration (no real VPS worker yet)  
> **Timeline:** ~2-3 weeks estimated

---

## 📋 Overall Flow

```
Phase 1: Setup & Auth (3-4 days)
    ↓
Phase 2: Projects & Queues (5-6 days)
    ↓
Phase 3: Container Ops Mock (3-4 days)
    ↓
Phase 4: Heavy Jobs (optional, 2-3 days)
    ↓
Phase 5: Integration & Polish (2-3 days)
```

---

# Phase 1: Setup & Auth (Days 1-4)

## ✅ What's Already Done
- ✅ Prisma schema defined
- ✅ PrismaService implemented
- ✅ Compilation fixed
- ✅ Database connection (pending .env)

## 🔨 What to Code

### Day 1: Environment & Database
**Task 1.1: Configure .env**
```bash
# backend/.env
DATABASE_URL=postgresql://user:pass@localhost:5432/openclaw_dev
REDIS_URL=redis://localhost:6379
BETTER_AUTH_SECRET=<32-byte random hex>
GOOGLE_CLIENT_ID=<from Google OAuth>
GOOGLE_CLIENT_SECRET=<from Google OAuth>
FRONTEND_URL=http://localhost:3000
VPS_WORKER_SECRET=<random secret>
API_URL=http://localhost:3001
PORT=3001
NODE_ENV=development
```

**Task 1.2: Create initial database**
```bash
npx prisma migrate dev --name init
```

**Task 1.3: Seed plans data**
```bash
# backend/prisma/seed.ts
const plans = [
  {
    name: 'free',
    maxProjects: 1,
    ramMb: 1024,
    cpuVcpu: 0.5,
    storageGb: 4,
    heavyJobsPerDay: 3,
    idleTimeoutMin: 10,
    priceMonthly: 0,
  },
  {
    name: 'pro',
    maxProjects: 10,
    ramMb: 4096,
    cpuVcpu: 2,
    storageGb: 100,
    heavyJobsPerDay: 100,
    idleTimeoutMin: 30,
    priceMonthly: 2999, // $29.99
  },
];
```

Then run: `npx prisma db seed`

**✅ Test Checkpoint 1.1:**
```bash
# Verify database is accessible
npm run dev
# Should log: "PrismaModule dependencies initialized"
# Should not error on database connection
```

### Day 2: Auth Service Core

**Task 2.1: Implement password hashing utilities**
- Location: `src/auth/utils/password.ts`
- Exports: `hashPassword(password)`, `verifyPassword(hash, password)`
- Use: Node crypto `scrypt` + random salt
- **Test:** Unit test password hash/verify

```typescript
// Test: password utility
const hash = await hashPassword('test123');
const isMatch = await verifyPassword('test123', hash); // true
const noMatch = await verifyPassword('wrong', hash); // false
```

**Task 2.2: Implement AuthService methods**
- Location: `src/auth/auth.service.ts` (partially done, needs completion)
- Methods:
  - `register(email, password, name)` → create User + Account
  - `login(email, password)` → verify + create Session
  - `logout(token)` → delete Session
  - `getSession(token)` → verify Session exists
  - `verifyToken(token)` → Session + User
  - `signInWithGoogle(profile)` → upsert User + Account + Session

**✅ Test Checkpoint 2.1:**
```bash
# Unit tests: src/auth/auth.service.spec.ts
npm test -- auth.service.spec.ts
# Test cases:
# - register: new user → create user + account
# - register: duplicate email → throw error
# - login: correct password → create session
# - login: wrong password → throw error
# - logout: valid token → delete session
# - getSession: valid token → return user
# - getSession: expired token → throw error
```

### Day 3: Auth Endpoints & Guards

**Task 3.1: Implement SessionGuard**
- Location: `src/auth/guards/session.guard.ts`
- Read httpOnly cookie `sessionToken`
- Call `authService.verifyToken(token)`
- Attach user to request

**Task 3.2: Implement AuthController**
- POST `/api/auth/register` → register + auto-login
- POST `/api/auth/login` → login + set httpOnly cookie
- POST `/api/auth/logout` → logout
- GET `/api/auth/session` → current user (guard required)
- GET `/api/auth/sign-in/google` → redirect to Google
- GET `/api/auth/callback/google` → Google callback

**✅ Test Checkpoint 3.1: E2E Auth Flow**
```bash
# Manual test with curl/Postman
POST /api/auth/register
  Body: {email: "test@example.com", password: "pass123", name: "Test User"}
  → Response: {userId, email, sessionToken}
  → Cookie: sessionToken=...

GET /api/auth/session
  Cookie: sessionToken=...
  → Response: {id, email, name}

POST /api/auth/logout
  Cookie: sessionToken=...
  → Response: {success: true}
  → Session deleted from DB

GET /api/auth/session
  Cookie: (none)
  → Response: 401 Unauthorized
```

### Day 4: Auth Polish

**Task 4.1: Add rate limiting (register)**
- Limit 5 register attempts per IP per hour
- Use Fastify middleware or custom decorator

**Task 4.2: Input validation (Pipes)**
- Register DTO: `email`, `password` (8+ chars), `name`
- Login DTO: `email`, `password`
- Use class-validator

**Task 4.3: Error handling**
- 400 Bad Request (invalid input)
- 401 Unauthorized (wrong password)
- 409 Conflict (email exists)
- 500 Internal Server Error (DB down)

**✅ Test Checkpoint 4.1: Auth Edge Cases**
```bash
# Negative tests
POST /api/auth/register {email: "invalid-email"}
  → 400 Bad Request

POST /api/auth/register {password: "short"}
  → 400 Bad Request (password too short)

POST /api/auth/register {email: "existing@test.com", ...}
  → 409 Conflict (email already registered)

POST /api/auth/login {email: "test@test.com", password: "wrong"}
  → 401 Unauthorized

POST /api/auth/login {email: "nonexistent@test.com", ...}
  → 401 Unauthorized
```

---

# Phase 2: Projects & Queues (Days 5-10)

## 🔨 What to Code

### Day 5: Queue Infrastructure Setup

**Task 5.1: Implement QueueService (Redis wrapper)**
- Location: `src/queue/queue.service.ts`
- Exports:
  - `enqueueSpawn(projectId, userId, subdomain, ...)`
  - `enqueueWake(projectId, userId)`
  - `enqueueStop(projectId, userId)`
  - `enqueueDestroy(projectId, userId)`
- Use BullMQ with priorities

**Task 5.2: Implement queue consumers (mocked)**
- Location: `src/queue/consumers/`
- **For MVP, DON'T actually consume.** Just:
  - `ConsumerService`: Listen to queue (logging only)
  - Simulated responses (call Internal API mock)
- Real worker will consume in Phase 3

**✅ Test Checkpoint 5.1: Queue Enqueue**
```bash
# Verify jobs are queued (not consumed yet)
# Check Redis directly or via BullMQ UI
redis-cli
> KEYS *container-ops*
> (should see job data)

# Or use BullMQ board: npm install bull-board
GET http://localhost:3001/admin/queues
# Should show "container-ops" queue with pending jobs
```

### Day 6: Projects Service (Basic CRUD)

**Task 6.1: Implement ProjectsService**
- Location: `src/projects/projects.service.ts` (partially done)
- Methods:
  - `getMyProjects(userId)` → list user's projects
  - `createProject(userId)` → create + enqueue spawn (mocked)
  - `getProjectHealth(projectId, userId)` → check status
  - `getProjectInstances(projectId, userId)` → list containers
  - `deleteProject(projectId, userId)` → soft/hard delete
  - `startProject(projectId, userId)` → set status=STARTING + enqueue wake
  - `stopProject(projectId, userId)` → set status=STOPPING + enqueue stop

**Task 6.2: Implement ProjectsController**
- Location: `src/projects/projects.controller.ts`
- GET `/api/projects/mine` → SessionGuard required
- POST `/api/projects` → SessionGuard required
- GET `/api/projects/:id/health`
- GET `/api/projects/:id/instances`
- POST `/api/projects/:id/start` → SessionGuard
- POST `/api/projects/:id/stop` → SessionGuard
- DELETE `/api/projects/:id` → SessionGuard

**✅ Test Checkpoint 6.1: Projects CRUD**
```bash
# Test with authenticated session cookie
GET /api/projects/mine
  → Response: [] (empty initially)

POST /api/projects
  Body: {} (auto-generate subdomain)
  → Response: {
      projectId: "abc123",
      subdomain: "xyz789.openclaw.ai",
      status: "CREATING",
      createdAt: "2026-04-20T09:00:00Z"
    }
  → Job enqueued (verify in Redis)

GET /api/projects/mine
  → Response: [{projectId, subdomain, status: "CREATING", ...}]

GET /api/projects/abc123/health
  → Response: {status: "CREATING", domain: "xyz789.openclaw.ai", lastActiveAt: "..."}

DELETE /api/projects/abc123
  → Response: {success: true}
  → Project no longer in /api/projects/mine
```

### Day 7: Internal API (Mock VPS Callbacks)

**Task 7.1: Implement InternalController**
- Location: `src/internal/internal.controller.ts`
- Middleware: Verify `Authorization: Bearer {VPS_WORKER_SECRET}` header
- Endpoints:
  - POST `/api/internal/status` → update project + container status
  - POST `/api/internal/heartbeat` → update lastActiveAt

**Task 7.2: Mock VPS worker callbacks**
- Create `src/queue/consumers/mock-worker.ts`
- Simulate: when job enqueued, auto-call `/api/internal/status` after 1-2 seconds
- This allows testing without real Docker

**Example flow:**
```
1. POST /api/projects → enqueue "spawn"
2. MockWorker sees job → simulate 1s
3. MockWorker calls POST /api/internal/status
   {projectId, status: "RUNNING", containerId: "mock-12345"}
4. Project status updates to RUNNING in DB
5. User can see status change in /api/projects/:id/health
```

**✅ Test Checkpoint 7.1: Status Flow**
```bash
POST /api/projects
  → projectId: "abc123", status: "CREATING"

# Wait 1-2 seconds (mock worker simulates)
GET /api/projects/abc123/health
  → status: "RUNNING" (auto-updated!)

POST /api/projects/abc123/stop
  → status: "STOPPING"

# Wait 1-2 seconds
GET /api/projects/abc123/health
  → status: "STOPPED"
```

### Day 8: Plan Limits & Validation

**Task 8.1: Implement plan quota checks**
- In `ProjectsService.createProject()`:
  - Check user subscription plan
  - Validate `maxProjects` limit
  - Allocate CPU/RAM from plan
  - Store snapshot in ContainerInstance

**Task 8.2: Validate project ownership**
- All project endpoints must verify `projectId` belongs to `userId`
- Use service method: `assertProjectOwnership(projectId, userId)`

**Task 8.3: Handle plan changes**
- When user upgrades/downgrades plan:
  - Update Subscription record
  - Don't retroactively change running containers (snapshot at spawn time)
  - New containers use new plan limits

**✅ Test Checkpoint 8.1: Plan Limits**
```bash
# Free user: max 1 project
POST /api/projects → {projectId: "p1"}
POST /api/projects → 409 Conflict "Max projects (1) reached"

# Verify project ownership
GET /api/projects/otheruser-project (as different user)
  → 403 Forbidden

# Verify resource allocation
POST /api/projects
  → ContainerInstance.ramLimit = 1024 (from free plan)
  → ContainerInstance.cpuLimit = 0.5
```

### Day 9: Error Handling & Validation

**Task 9.1: Add DTO validation**
- `CreateProjectDto`: validate fields if any
- `StartProjectDto`, `StopProjectDto`: empty body validation
- Use `class-validator`

**Task 9.2: Global error handler**
- Catch 404, 409, 401, 500 errors
- Return consistent JSON error format:
  ```json
  {
    "statusCode": 404,
    "message": "Project not found",
    "timestamp": "2026-04-20T09:00:00Z"
  }
  ```

**Task 9.3: Validate subdomain**
- Must be unique
- Alphanumeric lowercase + hyphen only
- 8 chars (nanoid)
- Index in database

**✅ Test Checkpoint 9.1: Error Cases**
```bash
GET /api/projects/nonexistent
  → 404 {message: "Project not found"}

GET /api/projects/invalid-id-format
  → 400 {message: "Invalid project ID"}

POST /api/projects (without session)
  → 401 {message: "Unauthorized"}

DELETE /api/projects/p1 (invalid ownership)
  → 403 {message: "Forbidden"}
```

### Day 10: Integration Test (Phase 2 Complete)

**Task 10.1: Write E2E test suite**
- Location: `test/projects.e2e.spec.ts`
- Scenarios:
  1. Register user → create project → check status → delete
  2. Create 2 projects → list them → start/stop one
  3. Try to create 2nd project as free user → should fail
  4. Try to access other user's project → 403
  5. Mock worker auto-updates status → verify in GET

**✅ Test Checkpoint 10.1: Full E2E**
```bash
npm run test:e2e
# Should pass all scenarios above
```

---

# Phase 3: Container Ops & Idle Detection (Days 11-14)

## 🔨 What to Code

### Day 11: Idle Detection Scheduler

**Task 11.1: Implement IdleDetectionService**
- Location: `src/scheduler/idle-detection.service.ts`
- Runs every 1 minute (configurable)
- Query: `projects WHERE status=RUNNING AND lastActiveAt < NOW()-idleTimeoutMin`
- For each stale project:
  - Update status to STOPPING
  - Enqueue "stop" job (priority=10, lowest)

**Task 11.2: Implement SchedulerModule**
- Register IdleDetectionService as OnModuleInit
- Start cron job on app startup

**✅ Test Checkpoint 11.1: Idle Detection**
```bash
# Create project, let it RUNNING
POST /api/projects → status: "RUNNING", lastActiveAt: NOW()

# Don't heartbeat for > idleTimeoutMin (10 min in free plan)
# Manually trigger scheduler (for testing):
POST /api/internal/trigger-idle-detection (dev only)

# Check project status
GET /api/projects/abc123/health
  → status: "STOPPED" (auto-stopped!)
```

### Day 12: Heartbeat System

**Task 12.1: Implement heartbeat endpoint**
- POST `/api/internal/heartbeat` (VPS_WORKER_SECRET required)
- Body: `{projectId}`
- Updates: `Project.lastActiveAt = NOW()`
- Response: `{success: true}`

**Task 12.2: Test heartbeat prevents idle**
- Create project, start it
- Heartbeat every 5 minutes
- Verify status stays RUNNING
- Stop heartbeating → auto-stops after idleTimeoutMin

**✅ Test Checkpoint 12.1: Heartbeat Prevents Idle**
```bash
POST /api/projects → projectId: "abc123", status: "RUNNING"

# Simulate heartbeat loop (every 5 min for 15 min)
POST /api/internal/heartbeat {projectId: "abc123"}
POST /api/internal/heartbeat {projectId: "abc123"}
POST /api/internal/heartbeat {projectId: "abc123"}

# Trigger idle detection
POST /api/internal/trigger-idle-detection

GET /api/projects/abc123/health
  → status: "RUNNING" (still running due to heartbeats)

# Stop heartbeating, wait idleTimeoutMin
(no heartbeat for 10+ minutes)
POST /api/internal/trigger-idle-detection

GET /api/projects/abc123/health
  → status: "STOPPED" (finally stopped)
```

### Day 13: Wake Container Flow

**Task 13.1: Implement start endpoint**
- POST `/api/projects/:id/start` (SessionGuard required)
- Check current status ≠ RUNNING
- Update status → STARTING
- Enqueue "wake" job (priority=1, highest)
- Return `{status: "STARTING", estimatedWait: "3-5s"}`

**Task 13.2: Verify job priority works**
- Enqueue multiple jobs: spawn (p=5), stop (p=10), wake (p=1)
- Verify "wake" executes first

**✅ Test Checkpoint 13.1: Wake Priority**
```bash
# Project is STOPPED
POST /api/projects/abc123/start
  → status: "STARTING"

# Wait 2 seconds (mock worker simulates)
GET /api/projects/abc123/health
  → status: "RUNNING"

# Verify wake had priority over other jobs (check queue order)
```

### Day 14: Advanced Scenarios

**Task 14.1: Handle concurrent operations**
- User clicks start twice rapidly
- Verify idempotency (only 1 job enqueued)
- Use optimistic locking or check status first

**Task 14.2: Handle error states**
- If spawn fails → set Project.status=ERROR + errorMessage
- If wake fails → set Project.status=ERROR
- User can retry (manual restart)

**Task 14.3: Container instance history**
- GET `/api/projects/:id/instances` → list all ContainerInstance records
- Show: startedAt, stoppedAt, exitCode, errorMessage
- This is audit trail of container lifecycle

**✅ Test Checkpoint 14.1: Advanced Flows**
```bash
# Concurrent start (test idempotency)
POST /api/projects/abc123/start
POST /api/projects/abc123/start (immediately)
# Should only enqueue 1 "wake" job

# Check instances history
GET /api/projects/abc123/instances
  → Response: [
      {id: "inst-1", status: "STOPPED", startedAt: "...", stoppedAt: "..."},
      {id: "inst-2", status: "RUNNING", startedAt: "...", stoppedAt: null}
    ]
```

---

# Phase 4: Heavy Jobs (Optional, Days 15-17)

## 🔨 What to Code

### Day 15: Heavy Jobs Service (Pro Plan Only)

**Task 15.1: Implement HeavyJobsService**
- Location: `src/heavy-jobs/heavy-jobs.service.ts`
- **Pro plan only** - reject free users with 403 Forbidden
- Methods:
  - `submitJob(userId, projectId, tool, params)` → verify Pro plan → create HeavyJob + enqueue
  - `getJobStatus(jobId, userId)` → check status
  - `cancelJob(jobId, userId)` → set status=CANCELLED
  - `getJobResult(jobId, userId)` → get resultPath
  - `listJobs(userId, projectId)` → query jobs

**Task 15.2: Implement HeavyJobsController**
- POST `/api/heavy/submit` → {tool, params} (Pro only)
- GET `/api/heavy/status/:jobId`
- POST `/api/heavy/cancel/:jobId`
- GET `/api/heavy/results/:jobId`
- GET `/api/heavy/history`

**Task 15.3: Implement quota checking**
- **Check plan: Free → 403 Forbidden "Pro plan only"**
- Check user plan: `heavyJobsPerDay` limit (Pro: 100/day)
- Query HeavyJob WHERE userId AND status=PROCESSING AND DATE=today
- Reject if >= limit

**✅ Test Checkpoint 15.1: Heavy Job CRUD**
```bash
POST /api/heavy/submit
  Body: {tool: "FFMPEG", params: {video: "...", cmd: "..."}}
  → Response: {jobId: "job-123", status: "PENDING"}

GET /api/heavy/status/job-123
  → {status: "PENDING"}

GET /api/heavy/history
  → [{jobId, tool, status, submittedAt, ...}]
```

### Day 16: Heavy Job Mocking

**Task 16.1: Implement mock heavy worker**
- Similar to mock container worker (Phase 2)
- When job enqueued, simulate after 2-3 seconds:
  - Update HeavyJob.status → DONE/FAILED
  - Set resultPath (for DONE)
  - Set errorMessage (for FAILED)

**Task 16.2: Implement quota limits**
- Check `heavyJobsPerDay` before submitting
- Free plan: 3 per day
- Pro plan: 100 per day

**✅ Test Checkpoint 16.1: Heavy Job Mock**
```bash
POST /api/heavy/submit {tool: "FFMPEG", ...}
  → {jobId: "job-1", status: "PENDING"}

# Wait 2-3 seconds
GET /api/heavy/status/job-1
  → {status: "DONE", resultPath: "/results/job-1/output.mp4"}

# Test quota limit (free plan: 3/day)
for i in 1..4; do
  POST /api/heavy/submit ...
done
# 4th should fail: 429 "Daily heavy job limit (3) reached"
```

### Day 17: Heavy Job Polish

**Task 17.1: Add result download**
- GET `/api/heavy/results/:jobId` → serve file from resultPath
- Check ownership + quotas

**Task 17.2: Add job expiration**
- Results auto-delete after 30 days
- Implement with DB trigger or cron job

**Task 17.3: Add cancellation**
- POST `/api/heavy/cancel/:jobId` → set status=CANCELLED
- Verify job is PENDING/PROCESSING (not DONE)

**✅ Test Checkpoint 17.1: Heavy Job Advanced**
```bash
POST /api/heavy/submit → {jobId}
POST /api/heavy/cancel/{jobId}
GET /api/heavy/status/{jobId}
  → {status: "CANCELLED"}

GET /api/heavy/results/{jobId}
  → 404 (not done)

# Wait for mock worker
GET /api/heavy/results/{jobId}
  → 200 with file (or 404 if error)
```

---

# Phase 5: Integration & Polish (Days 18-21)

## 🔨 What to Code

### Day 18: Database Migrations & Seed

**Task 18.1: Create seed script**
- `npx prisma db seed` → create demo plans + test user

**Task 18.2: Test migrations**
- Verify `npx prisma migrate dev` works
- Test `npx prisma migrate reset` (local dev)
- Document production migration (Railway)

**Task 18.3: Backup strategy**
- Document how to backup PostgreSQL
- Test restore process

### Day 19: Error Scenarios & Resilience

**Task 19.1: Handle database downtime**
- Middleware: catch DB errors → 503 Service Unavailable

**Task 19.2: Handle queue downtime**
- If Redis unavailable, should queue enqueue fail fast or retry?
- Document behavior

**Task 19.3: Handle network timeouts**
- Internal API calls to VPS worker: timeout after 5s
- Retry queue jobs with exponential backoff

**✅ Test Checkpoint 19.1: Resilience**
```bash
# Stop Redis
redis-cli shutdown

POST /api/projects
  → Should fail with clear error (not hang)

# Restart Redis
redis-server

POST /api/projects
  → Should work again
```

### Day 20: Documentation & Code Review

**Task 20.1: API documentation**
- Generate from code (Swagger)
- Host at `/api/docs`

**Task 20.2: Code review**
- Check all services follow patterns
- Verify error handling consistent
- Check security (SQL injection, etc.)

**Task 20.3: README updates**
- Setup instructions
- Running the backend
- Testing

### Day 21: Final E2E & Deployment Setup

**Task 21.1: Full E2E test**
```bash
npm run test:e2e
# All scenarios pass
```

**Task 21.2: Docker setup (optional)**
- `Dockerfile` for backend
- `docker-compose.yml` with PostgreSQL + Redis
- Test local Docker build

**Task 21.3: CI/CD setup (optional)**
- GitHub Actions: lint, test, build on push
- Deploy to Railway on merge to main

**✅ Final Checkpoint: MVP Complete**
```bash
# Verify all endpoints work:
✅ Auth (register, login, logout, session)
✅ Projects (list, create, start, stop, delete)
✅ Health (status, instances history)
✅ Internal (heartbeat, status)
✅ Heavy jobs (submit, status, cancel, results)
✅ Error handling (404, 401, 409, 500)
✅ Rate limiting (register)
✅ Plan limits (max projects, heavy jobs/day)
✅ Database (migrations, seed)
✅ Idling (auto-stop, idle detection)
```

---

# Testing Checklist by Phase

## Phase 1: Auth ✅
- [ ] Unit: password hash/verify
- [ ] Unit: register/login logic
- [ ] E2E: register → login → logout flow
- [ ] E2E: duplicate email rejection
- [ ] E2E: wrong password rejection
- [ ] E2E: session expires
- [ ] E2E: rate limit register

## Phase 2: Projects ✅
- [ ] Unit: ProjectsService CRUD
- [ ] E2E: create project (get projectId)
- [ ] E2E: list my projects
- [ ] E2E: get project health
- [ ] E2E: delete project
- [ ] E2E: plan limit (max projects)
- [ ] E2E: ownership check (403 for other's project)
- [ ] E2E: invalid subdomain rejection

## Phase 3: Container Ops ✅
- [ ] E2E: spawn (status: CREATING → RUNNING)
- [ ] E2E: start (status: STOPPED → RUNNING)
- [ ] E2E: stop (status: RUNNING → STOPPED)
- [ ] E2E: idle detection (auto-stop after timeout)
- [ ] E2E: heartbeat prevents idle
- [ ] E2E: concurrent operations (idempotency)
- [ ] E2E: instances history list
- [ ] E2E: error state handling

## Phase 4: Heavy Jobs ✅
- [ ] Unit: quota calculation
- [ ] E2E: submit heavy job
- [ ] E2E: get job status
- [ ] E2E: cancel job
- [ ] E2E: quota limit enforcement
- [ ] E2E: job history list

## Phase 5: Integration ✅
- [ ] E2E: full user flow (register → create → start → stop → delete)
- [ ] E2E: database migrations work
- [ ] E2E: error handling (DB down, Redis down)
- [ ] Load: multiple projects in queue
- [ ] Load: multiple users concurrently
- [ ] Security: SQL injection attempts fail
- [ ] Security: auth bypass attempts fail

---

# Quick Reference: Key Commands

```bash
# Setup
npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed

# Development
npm run dev          # watch mode
npm run build        # compile
npm test            # unit tests
npm run test:watch  # watch mode
npm run test:e2e    # e2e tests

# Database
npx prisma studio  # GUI for database

# Queue (BullMQ Admin)
# Visit http://localhost:3001/admin/queues

# Formatting
npm run format      # prettier
npm run lint        # eslint + fix
```

---

# Notes for Developers

### Session-based Auth (Not JWT)
- Session tokens stored in DB → revokable immediately
- httpOnly cookie → prevents XSS
- Each session has expiry (30 days)
- Great for MVP, can migrate to JWT later

### Queue Architecture
- **MVP:** Single Redis for all queues (container-ops + heavy-tasks)
- **Scale:** Split into 2 Redis instances later
- Mock workers simulate VPS behavior (no real Docker needed yet)

### Container Snapshot
- When spawning, snapshot CPU/RAM from plan
- Prevents inconsistency if user upgrades plan mid-execution
- ContainerInstance is audit trail

### Idle Detection
- Scheduled every 1 minute
- Looks at `lastActiveAt` field
- Auto-stops if stale > `idleTimeoutMin`
- Heartbeat resets timer (VPS worker sends every 5 min)

### Error Handling Strategy
- Service layer validates business logic
- Controller validates input
- Global error handler catches rest
- All errors logged (for debugging)
- Return consistent JSON format

### Testing Philosophy
- Unit tests for services (logic)
- E2E tests for flows (user perspective)
- Mock external deps (Redis, Docker)
- No mocking of database (use test DB)

---

# Estimated Timeline

| Phase | Days | Status |
|-------|------|--------|
| Phase 1: Auth | 4 | ⬜ TODO |
| Phase 2: Projects + Queues | 6 | ⬜ TODO |
| Phase 3: Container Ops | 4 | ⬜ TODO |
| Phase 4: Heavy Jobs | 3 | ⬜ OPTIONAL |
| Phase 5: Polish + Deployment | 4 | ⬜ TODO |
| **Total** | **~21 days** | **MVP ready** |

---

**Last Updated:** 2026-04-20  
**Backend Status:** 🔴 Phase 0 (Setup Complete, Phase 1 Starting)
