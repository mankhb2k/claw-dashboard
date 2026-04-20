# Day 7: Internal API (Mock VPS Callbacks) - Implementation Plan

## Overview
Implement the internal API endpoints for VPS worker callbacks and create a mock worker for local testing without real Docker infrastructure.

## Files to Create

### 1. `src/internal/internal.controller.ts` (NEW)
- Middleware: verify `Authorization: Bearer {VPS_WORKER_SECRET}`
- Endpoints:
  - `POST /api/internal/status` → update project & container status
  - `POST /api/internal/heartbeat` → update lastActiveAt timestamp

**Key Methods:**
```typescript
@Post('status')
async updateStatus(
  projectId: string,
  status: ProjectStatus,
  containerId?: string
)

@Post('heartbeat')
async updateHeartbeat(
  projectId: string,
  timestamp: Date
)
```

### 2. `src/internal/internal.module.ts` (NEW)
- Module definition
- Import: PrismaModule, AuthModule (for guards)
- Export: InternalController

### 3. `src/internal/dtos/update-status.dto.ts` (NEW)
```typescript
@IsString()
projectId: string;

@IsEnum(ProjectStatus)
status: ProjectStatus;

@IsOptional()
@IsString()
containerId?: string;
```

### 4. `src/internal/dtos/update-heartbeat.dto.ts` (NEW)
```typescript
@IsString()
projectId: string;

@IsISO8601()
lastActiveAt: Date;
```

### 5. `src/queue/consumers/mock-worker.ts` (NEW)
- Listen to BullMQ queue events
- When job added: simulate processing after 1-2 seconds
- Call internal API endpoints to update project status
- Handle all job types: spawn, wake, stop, destroy

**Mock Flow:**
```typescript
- On spawn job: wait 1s → POST /api/internal/status {status: "RUNNING"}
- On wake job: wait 1s → POST /api/internal/status {status: "RUNNING"}
- On stop job: wait 1s → POST /api/internal/status {status: "STOPPED"}
- On destroy job: wait 1s → POST /api/internal/status {status: "DESTROYING"}
```

### 6. `src/queue/queue-consumer.service.ts` (NEW)
- Service to initialize mock worker
- Register queue event listeners
- Call internal API with VPS_WORKER_SECRET

### 7. `src/internal/guards/worker-secret.guard.ts` (NEW)
- Guard to verify `Authorization: Bearer {VPS_WORKER_SECRET}` header
- Extract & validate secret from environment variable

## Files to Modify

### 1. `src/app.module.ts`
- Add `InternalModule` to imports
- Initialize mock worker when app starts (development mode)

### 2. `src/queue/queue.module.ts`
- Add QueueConsumerService provider
- Add to imports in app.module for auto-initialization

### 3. `src/projects/projects.service.ts`
- Add method: `updateProjectStatus(projectId, status, containerId?)`
- Add method: `updateLastActiveAt(projectId, timestamp)`
- These are called by InternalController

### 4. `test/projects.e2e.spec.ts`
- Add test: wait for mock worker update
- Verify status changes after spawn/wake/stop

### 5. `src/prisma/prisma.service.ts`
- Ensure onModuleInit runs (seed plans table if empty)
- Mock worker needs free plan to exist

## Database Requirements

### Plan Seeding
Ensure `plans` table has at least:
```
{
  id: 'free',
  name: 'free',
  maxProjects: 1,
  cpuVcpu: 0.5,
  ramMb: 1024,
  price: 0
}
```

## Test Checkpoints

### Checkpoint 7.1: Status Flow (Manual Test)
```bash
# Terminal 1: Start app
npm run dev

# Terminal 2: Test API
# 1. Create project
POST http://localhost:3001/api/projects
Headers: Cookie: session_token={cookie}
→ Response: {projectId: "abc123", status: "CREATING", ...}

# 2. Wait 2 seconds (mock worker processes)

# 3. Check health
GET http://localhost:3001/api/projects/abc123/health
→ Response: {..., status: "RUNNING", ...}

# 4. Stop project
POST http://localhost:3001/api/projects/abc123/stop
→ Response: {..., status: "STOPPING", ...}

# 5. Wait 2 seconds

# 6. Check status updated
GET http://localhost:3001/api/projects/abc123/health
→ Response: {..., status: "STOPPED", ...}
```

### Checkpoint 7.2: Unit Tests
```bash
npm test -- src/internal/internal.controller.spec.ts
npm test -- src/queue/queue-consumer.service.spec.ts
```

**Test Cases:**
- InternalController.updateStatus with valid VPS_WORKER_SECRET
- InternalController.updateStatus without Authorization header (401)
- InternalController.updateStatus with invalid secret (403)
- InternalController.updateHeartbeat updates lastActiveAt
- MockWorker enqueues job → calls updateStatus after delay
- MockWorker all job types (spawn, wake, stop, destroy)

## Implementation Order

1. Create WorkerSecretGuard
2. Create InternalController & DTOs
3. Create InternalModule
4. Add methods to ProjectsService for status updates
5. Create MockWorker consumer
6. Create QueueConsumerService
7. Update AppModule to initialize queue consumer
8. Add unit tests
9. Manual E2E flow test

## Notes
- Mock worker only runs in development (check NODE_ENV)
- Real VPS worker will implement same `/api/internal/status` contract
- Heartbeat endpoint not used by mock worker yet (reserved for real worker)
- All timestamps in UTC ISO8601 format
