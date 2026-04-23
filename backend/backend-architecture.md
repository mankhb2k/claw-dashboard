# Backend Architecture

## Overview

The backend is built with **NestJS** using a **Core + Features (Plugin) Architecture**. This design separates infrastructure and cross-cutting concerns (Core) from business logic (Features), enabling modular, scalable development where new features can be added with minimal coupling to existing systems.

```
┌─────────────────────────────────────────────┐
│         NestJS Application (AppModule)      │
├──────────────────┬──────────────────────────┤
│      CORE        │       FEATURES           │
│ (Infrastructure) │   (Business Logic)       │
├──────────────────┼──────────────────────────┤
│ • Database       │ • Projects               │
│ • Auth           │ • Heavy Jobs             │
│ • Queue          │ • Scheduler              │
│ • Billing        │ • Worker Callbacks       │
│ • Common         │                          │
└──────────────────┴──────────────────────────┘
```

---

## Architecture Layers

### Core Modules (Infrastructure)

Core modules provide foundational services required across the application. They are always loaded and provide no business logic.

#### 1. **Database** (`src/core/database/`)
- **PrismaModule**: Provides database connection
- **PrismaService**: Singleton service for all database queries
- Manages schema, migrations, and connection pooling

#### 2. **Authentication** (`src/core/auth/`)
- Session management and validation
- OAuth integration (if applicable)
- Auth guards for route protection
- DTOs for auth payloads

#### 3. **Queue** (`src/core/queue/`)
- **QueueModule**: Configures BullMQ for async job processing
- **QueueService**: Provides methods to enqueue different job types
  - `enqueueHeavyJob(tool, payload)`: Enqueue tool execution
  - `enqueueSchedulerJob(task)`: Enqueue scheduled tasks
  - Consumer processes jobs by type with dedicated handlers

#### 4. **Billing** (`src/core/billing/`)
- **SubscriptionService**: Manages user subscription plans
- **PlanGateService**: Centralized authorization gate for plan-based limits (NEW)

#### 5. **Common** (`src/core/common/`)
- Shared utilities, validators, interceptors, filters
- **Events** (`events/app-events.ts`): Typed event definitions and constants (NEW)
  - Centralized event publishing and listening
  - Enables decoupled communication between modules

---

### Feature Modules (Business Logic)

Feature modules implement specific business capabilities. They depend on Core modules but should not depend on each other directly — they communicate through events.

#### 1. **Projects** (`src/features/projects/`)
- Create, update, delete projects
- Start/stop project deployment
- Plan-gated operations via **PlanGateService**
- Publishes events: `PROJECT_CREATED`, `PROJECT_STARTED`, `PROJECT_STOPPED`, `PROJECT_DELETED`

#### 2. **Heavy Jobs** (`src/features/heavy-jobs/`)
- Submit, monitor, and cancel async jobs (FFMPEG, Playwright, TTS, STT)
- **ToolRegistry**: Registry pattern for pluggable tool configuration (NEW)
- Dynamic mock worker that auto-registers handlers for all registered tools
- Plan-gated operations via **PlanGateService**
- Publishes events: `HEAVY_JOB_SUBMITTED`, `HEAVY_JOB_CANCELLED`

#### 3. **Scheduler** (`src/features/scheduler/`)
- Idle detection and maintenance cron jobs
- Can listen to events from other features (e.g., PROJECT_STARTED)

#### 4. **Worker Callbacks** (`src/features/worker-callbacks/`)
- Receives callbacks from external VPS workers
- Webhook handlers for job result updates

---

## Three Core Design Abstractions

### 1. PlanGateService (Centralized Authorization)

**Problem Solved**: Plan checking logic was scattered across services, making it hard to maintain and extend.

**Solution**: Single service that centralizes all plan-based access control.

**File**: `src/core/billing/plan-gate.service.ts`

**Key Methods**:

```typescript
getPlanForUser(userId: string): Promise<Plan>
// Returns user's subscription plan or free-plan fallback

assertProjectLimit(userId: string): Promise<void>
// Throws ConflictException if user has reached max projects for their plan
// Usage in ProjectsService.createProject()

assertHeavyJobQuota(userId: string): Promise<void>
// Throws ForbiddenException if user is not Pro or quota exhausted
// Usage in HeavyJobsService.submitJob()
```

**Benefits**:
- Single source of truth for plan limits
- Easy to update plan rules without searching multiple services
- Consistent error handling across the app
- Testable in isolation

**Usage Example**:
```typescript
// In ProjectsService
async createProject(userId: string, name: string) {
  await this.planGate.assertProjectLimit(userId);
  // ... create project
}
```

---

### 2. EventEmitter2 (Decoupled Communication)

**Problem Solved**: Services were directly dependent on each other, creating tight coupling and circular dependency risks.

**Solution**: Event-driven architecture using `@nestjs/event-emitter` for publish-subscribe pattern.

**File**: `src/core/common/events/app-events.ts`

**Defined Events**:

```typescript
export enum AppEvents {
  PROJECT_CREATED = 'project.created',
  PROJECT_STARTED = 'project.started',
  PROJECT_STOPPED = 'project.stopped',
  PROJECT_DELETED = 'project.deleted',
  HEAVY_JOB_SUBMITTED = 'heavy-job.submitted',
  HEAVY_JOB_CANCELLED = 'heavy-job.cancelled',
}

// Typed event payloads
export interface ProjectCreatedEvent {
  projectId: string;
  userId: string;
  subdomain: string;
  planName: string;
}

export interface HeavyJobSubmittedEvent {
  jobId: string;
  userId: string;
  projectId: string;
  tool: string;
}
```

**Publishing Events**:
```typescript
// In HeavyJobsService
this.events.emit(AppEvents.HEAVY_JOB_SUBMITTED, {
  jobId: job.id,
  userId,
  projectId,
  tool,
} satisfies HeavyJobSubmittedEvent);
```

**Listening to Events**:
```typescript
// In any @Injectable() service
import { OnEvent } from '@nestjs/event-emitter';

@OnEvent(AppEvents.PROJECT_CREATED)
handleProjectCreated(event: ProjectCreatedEvent) {
  // React to project creation without direct dependency on ProjectsService
}
```

**Benefits**:
- Loosely coupled services
- Easy to add new event listeners without modifying publishers
- Clear event contracts with TypeScript interfaces
- Enables features like audit logging, notifications, analytics without core changes

---

### 3. ToolRegistry (Pluggable Configuration)

**Problem Solved**: Tool configuration (timeouts, delays) was hardcoded in multiple places. Adding a new tool required changes scattered across files.

**Solution**: Registry pattern that centralizes tool configuration and metadata.

**File**: `src/features/heavy-jobs/tool-registry.ts`

**Structure**:

```typescript
export interface ToolConfig {
  timeout: number;      // Job timeout in ms
  estimatedWait: string; // User-facing estimate
  mockDelayMs: number;  // Delay for mock testing
}

export const TOOL_REGISTRY: Record<string, ToolConfig> = {
  FFMPEG: {
    timeout: 300000,
    estimatedWait: '2-5 minutes',
    mockDelayMs: 3000,
  },
  PLAYWRIGHT: {
    timeout: 120000,
    estimatedWait: '30-60 seconds',
    mockDelayMs: 1500,
  },
  TTS: {
    timeout: 120000,
    estimatedWait: '10-30 seconds',
    mockDelayMs: 1000,
  },
  STT: {
    timeout: 300000,
    estimatedWait: '1-2 minutes',
    mockDelayMs: 2000,
  },
};

export function getToolConfig(tool: string): ToolConfig {
  // Safe lookup with fallback
}
```

**Adding a New Tool** (3 steps):
1. Add entry to `TOOL_REGISTRY`
2. Mock worker automatically registers handler for it
3. Queue consumer processes it with registry timeout

**Before (Hardcoded Approach)**:
- Hardcoded `if (tool === 'FFMPEG') timeout = 300000`
- Mock worker had 4 separate `process()` calls
- Tool config scattered in multiple files

**After (Registry Approach)**:
- Single registry entry
- Dynamic handler registration in mock worker
- Tool timeout read from registry at runtime

**Usage**:
```typescript
// In HeavyJobsService
const toolConfig = getToolConfig(tool);
const estimatedWait = toolConfig.estimatedWait; // Show to user

// In MockHeavyWorkerService
for (const [tool, config] of Object.entries(TOOL_REGISTRY)) {
  const jobName = tool.toLowerCase();
  this.heavyTasksQueue.process(jobName, async (job) => {
    return this.processHeavyJob(job, tool, config.mockDelayMs);
  });
}
```

---

## Module Dependencies

### Import Graph

```
AppModule
├── EventEmitterModule.forRoot()
├── Core Modules
│   ├── PrismaModule
│   ├── QueueModule
│   ├── AuthModule
│   └── BillingModule
│       └── PlanGateService
└── Feature Modules
    ├── ProjectsModule
    │   └── imports [PrismaModule, AuthModule, CommonModule, QueueModule, BillingModule]
    ├── HeavyJobsModule
    │   ├── imports [PrismaModule, QueueModule, AuthModule, BillingModule]
    │   └── uses ToolRegistry
    ├── SchedulerModule
    │   └── Can listen to events (PROJECT_STARTED, etc.)
    └── WorkerCallbacksModule
        └── imports [PrismaModule, QueueModule]
```

### Why This Structure?

- **No circular dependencies**: Features → Core only, never Core → Features
- **Clear boundaries**: Each feature is isolated; communication via events
- **Testability**: Services can be tested in isolation with mocked dependencies
- **Extensibility**: New features import only what they need from Core

---

## Extensibility Patterns

### Adding a New Feature Module

1. **Create module structure**:
   ```
   src/features/my-feature/
   ├── my-feature.module.ts
   ├── my-feature.service.ts
   ├── my-feature.controller.ts
   └── dto/
   ```

2. **Define imports** (only from Core, never from other Features):
   ```typescript
   @Module({
     imports: [PrismaModule, AuthModule, QueueModule],
     providers: [MyFeatureService],
     controllers: [MyFeatureController],
   })
   export class MyFeatureModule {}
   ```

3. **Publish events** if other modules should react:
   ```typescript
   this.events.emit(AppEvents.MY_EVENT, payload);
   ```

4. **Listen to events** from other features:
   ```typescript
   @OnEvent(AppEvents.PROJECT_CREATED)
   handleProjectCreated(event: ProjectCreatedEvent) { }
   ```

5. **Add to AppModule**:
   ```typescript
   @Module({
     imports: [
       // ... existing modules
       MyFeatureModule,
     ],
   })
   ```

### Adding a New Tool (Heavy Jobs)

1. **Add to ToolRegistry**:
   ```typescript
   export const TOOL_REGISTRY = {
     // ... existing tools
     NEWTOOL: {
       timeout: 180000,
       estimatedWait: '1-3 minutes',
       mockDelayMs: 1500,
     },
   };
   ```

2. **Queue consumer automatically processes it** with the registry timeout
3. **Mock worker automatically registers handler** in development
4. **No other code changes needed**

### Reacting to Events

To add a new listener (e.g., audit logging, notifications):

1. **Inject EventEmitter2**:
   ```typescript
   constructor(private events: EventEmitter2) {}
   ```

2. **Create listener method**:
   ```typescript
   @OnEvent(AppEvents.HEAVY_JOB_SUBMITTED)
   async logJobSubmission(event: HeavyJobSubmittedEvent) {
     await this.auditLog.log(`Job ${event.jobId} submitted by ${event.userId}`);
   }
   ```

3. **Listener automatically called** when event published — no wiring needed

---

## Database Schema

Managed by **Prisma** (`src/core/database/`):
- `users` — User accounts
- `subscriptions` — Billing plans (consulted by **PlanGateService**)
- `projects` — User projects
- `heavyJobs` — Async job records (FFMPEG, Playwright, TTS, STT)

**Plan limits** are defined in `subscriptions.plan` and enforced by **PlanGateService** at request time, not in the database.

---

## Job Queue (BullMQ)

### Queue Types

1. **heavy-tasks** — Tool execution (FFMPEG, Playwright, TTS, STT)
   - Job names: `ffmpeg`, `playwright`, `tts`, `stt` (from TOOL_REGISTRY)
   - Timeout: From registry per tool
   - Mock worker processes all tools dynamically

2. **scheduler-tasks** — Cron and scheduled work
   - Idle detection, maintenance jobs

### Consumer Pattern

Handlers registered in **MockHeavyWorkerService** (dev) and production worker loop through **TOOL_REGISTRY** to dynamically process all tools:

```typescript
for (const [tool, config] of Object.entries(TOOL_REGISTRY)) {
  this.heavyTasksQueue.process(tool.toLowerCase(), async (job) => {
    return this.processHeavyJob(job, tool, config.mockDelayMs);
  });
}
```

---

## Best Practices

1. **Use PlanGateService** for all plan-based checks — never inline
2. **Prefer events over direct calls** — modules should not import each other's services
3. **Keep Core modules generic** — no business logic, only infrastructure
4. **Group related features** — a feature module includes all controllers, services, and DTOs for that feature
5. **Use TypeScript interfaces** for event payloads — ensures consistency and catches errors early
6. **Add new tools via registry only** — no code generation or hardcoded dispatch needed

---

## Migration Notes (From MVP to Modular Architecture)

The refactoring addressed three key coupling points:

1. **Scattered Plan Checks** → **PlanGateService**
   - Centralized all `getPlanForUser()`, `assertProjectLimit()` logic
   - Services now call a single method instead of checking subscriptions themselves

2. **Hardcoded Tool Dispatch** → **ToolRegistry + Dynamic Handlers**
   - Removed if/else chains in queue consumer
   - Mock worker registers handlers for all tools in TOOL_REGISTRY
   - New tools added without touching processing code

3. **Service Dependencies** → **EventEmitter2**
   - Replaced direct service calls with event listeners
   - Modules can now react to external events without importing each other
   - Enables audit logging, notifications, and other concerns without coupling

This architecture supports adding 10+ new tools, 5+ new features, and 100K+ users without major restructuring.
