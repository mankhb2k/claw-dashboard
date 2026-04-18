# OpenClaw SaaS — Backend (Control Plane)

> **Stack:** NestJS + Fastify · PostgreSQL · BullMQ  
> **Deploy:** Railway (API + PostgreSQL + Redis managed)  
> **Vai trò:** Auth · Quản lý projects · Enqueue jobs · Idle detection · KHÔNG chạy containers trực tiếp

---

## 1. Tại sao NestJS + Fastify

**Chọn vì:**
- Module hóa tốt, DI pattern → dễ maintain khi scale team
- Fastify ~2x nhanh hơn Express, built-in schema validation
- TypeScript first → bắt lỗi sớm
- BullMQ có official NestJS module

**Tradeoff:**
- Boilerplate nhiều hơn Hono/Elysia thuần
- Railway cold start ~3–5s (dùng Railway health check để keep warm)

---

## 2. Module Structure

```
src/
├── main.ts                      ← Bootstrap Fastify adapter
├── app.module.ts
├── auth/                        ← Better-Auth integration
│   ├── auth.module.ts
│   ├── auth.controller.ts       ← /api/auth/* delegate Better-Auth handler
│   └── session.guard.ts         ← NestJS guard verify session cookie
├── projects/
│   ├── projects.module.ts
│   ├── projects.controller.ts
│   ├── projects.service.ts
│   └── project.entity.ts
├── jobs/                        ← BullMQ producers (chỉ enqueue, không process)
│   ├── jobs.module.ts
│   └── jobs.producer.ts
├── idle/                        ← Idle detection scheduler
│   ├── idle.module.ts
│   └── idle.scheduler.ts
├── internal/                    ← Endpoints chỉ dùng nội bộ (VPS worker gọi)
│   ├── internal.module.ts
│   └── internal.controller.ts
└── database/
    └── database.module.ts       ← TypeORM + PostgreSQL
```

---

## 3. API Endpoints

### Auth (Better-Auth xử lý, NestJS chỉ mount handler)
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/session
GET    /api/auth/oauth/google
GET    /api/auth/oauth/google/callback
```

### Projects (cần session guard)
```
GET    /api/projects/mine           ← project của user đang login
POST   /api/projects                ← tạo project (free: check đã có chưa)
POST   /api/projects/:id/start      ← wake container
POST   /api/projects/:id/stop       ← stop thủ công
GET    /api/projects/:id/health     ← { status, domain, last_active_at }
DELETE /api/projects/:id            ← xóa project + volume (confirm trước)
```

### Heavy Tasks (NEW - async processing)
```
POST   /api/heavy/submit             ← user container submit heavy job
  {tool, params, userId}
  ← {jobId, estimatedTime}

GET    /api/heavy/status/:jobId      ← polling job status
  ← {status, progress, resultPath, error}

GET    /api/heavy/results/:jobId     ← download result (redirect to storage)
DELETE /api/heavy/results/:jobId     ← cleanup old result

GET    /api/heavy/history            ← list last 30 jobs
```

**Integration with heavy VPS:**
- VPS Heavy pulls from Redis queue: `openclaw:heavy:queue`
- On completion, calls: `PUT /api/internal/job/:jobId/result`
- Result stored at: `/data/users/{userId}/heavy-tasks/`

### Internal (chỉ nhận từ VPS worker/heavy, verify bằng secret header)
```
POST   /api/internal/status          ← worker báo container status thay đổi
POST   /api/internal/heartbeat       ← container ping để update last_active_at
POST   /api/internal/wake/:userId    ← wake-proxy gọi khi cần auto-wake (V2)
PUT    /api/internal/job/:jobId/result ← heavy VPS callback khi job xong
  {status, resultPath, size, checksum}
```

---

## 4. Database Schema

```sql
-- Better-Auth tự tạo: users, accounts, sessions, verification_tokens

CREATE TABLE plans (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                VARCHAR(50) UNIQUE,    -- 'free' | 'pro'
  max_projects        INT  DEFAULT 1,
  ram_mb              INT  DEFAULT 1024,
  cpu_vcpu            DECIMAL(2,1) DEFAULT 0.5,
  storage_gb          INT  DEFAULT 4,
  heavy_jobs_per_day  INT  DEFAULT 3,
  idle_timeout_min    INT  DEFAULT 10
);

CREATE TABLE projects (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id        UUID REFERENCES plans(id),
  subdomain      VARCHAR(63) UNIQUE NOT NULL,
  container_name VARCHAR(80),             -- 'openclaw-{userId}'
  status         VARCHAR(20) DEFAULT 'creating',
  -- 'creating' | 'running' | 'stopped' | 'starting' | 'error'
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  vps_id         VARCHAR(20) DEFAULT 'vps-1',  -- sẵn sàng cho multi-VPS
  storage_used_mb INT DEFAULT 0,
  heavy_quota_used INT DEFAULT 0,         -- calls used today
  error_message  TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE heavy_jobs (
  id              VARCHAR(50) PRIMARY KEY,  -- job_xyz
  user_id         UUID REFERENCES users(id),
  project_id      UUID REFERENCES projects(id),
  tool            VARCHAR(30),              -- 'ffmpeg' | 'playwright' | 'tts' | 'stt'
  params          JSONB,
  status          VARCHAR(20) DEFAULT 'pending',
  -- 'pending' | 'processing' | 'done' | 'failed' | 'cancelled'
  result_path     VARCHAR(255),
  result_size_mb  INT,
  error_message   TEXT,
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ              -- auto-delete after 30 days
);

-- Partial index: active jobs
CREATE INDEX idx_heavy_jobs_active
  ON heavy_jobs (user_id, status)
  WHERE status IN ('pending', 'processing');

-- Partial index: idle detection
CREATE INDEX idx_projects_idle
  ON projects (last_active_at)
  WHERE status = 'running';

CREATE INDEX idx_projects_user_id ON projects (user_id);
```

---

## 5. BullMQ — Chỉ Producer (consumer chạy trên VPS)

### Container Operations Queue

```typescript
// jobs/jobs.producer.ts
export type JobName = 'spawn' | 'stop' | 'wake' | 'destroy';

@Injectable()
export class JobsProducer {
  constructor(@InjectQueue('container-ops') private queue: Queue) {}

  async enqueueSpawn(projectId: string, userId: string, subdomain: string) {
    return this.queue.add('spawn', { projectId, userId, subdomain }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5_000 },
    });
  }

  async enqueueWake(projectId: string, userId: string) {
    return this.queue.add('wake', { projectId, userId }, {
      priority: 1,    // cao nhất — user đang chờ
      attempts: 2,
      backoff: { type: 'fixed', delay: 2_000 },
    });
  }

  async enqueueStop(projectId: string, userId: string) {
    return this.queue.add('stop', { projectId, userId }, {
      priority: 10,   // thấp — background task
      attempts: 1,
    });
  }
```

### Heavy Tasks Queue (NEW)

```typescript
// jobs/heavy.producer.ts
export type HeavyTool = 'ffmpeg' | 'playwright' | 'tts' | 'stt';

interface HeavyJobParams {
  tool: HeavyTool;
  params: Record<string, any>;
  userId: string;
  projectId: string;
}

@Injectable()
export class HeavyJobsProducer {
  constructor(@InjectQueue('heavy-tasks') private queue: Queue) {}

  async submitHeavyJob(data: HeavyJobParams) {
    // 1. Check quota
    const project = await this.projectsService.getById(data.projectId);
    const usedToday = await this.getQuotaUsedToday(data.userId);
    
    if (usedToday >= project.plan.heavy_jobs_per_day) {
      throw new Error('Daily quota exceeded');
    }
    
    // 2. Enqueue
    const job = await this.queue.add('process', data, {
      attempts: 1,  // No retry — user can resubmit
      timeout: this.getTimeout(data.tool),
    });
    
    // 3. Track in DB
    await this.db.heavy_jobs.insert({
      id: job.id,
      user_id: data.userId,
      tool: data.tool,
      params: data.params,
      status: 'pending',
      submitted_at: new Date(),
    });
    
    return { jobId: job.id, estimatedTime: this.getEstimate(data.tool) };
  }

  private getTimeout(tool: HeavyTool): number {
    return {
      ffmpeg: 300_000,     // 5 minutes
      playwright: 120_000, // 2 minutes
      tts: 120_000,
      stt: 300_000,
    }[tool];
  }

  private getEstimate(tool: HeavyTool): string {
    return {
      ffmpeg: '2-5 minutes',
      playwright: '30-60 seconds',
      tts: '30-60 seconds',
      stt: '1-2 minutes',
    }[tool];
  }

  private async getQuotaUsedToday(userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    return await this.db.query(
      `SELECT COUNT(*) FROM heavy_jobs 
       WHERE user_id = $1 AND DATE(submitted_at) = $2`,
      [userId, today]
    );
  }
}
```

  async enqueueDestroy(projectId: string, userId: string) {
    return this.queue.add('destroy', { projectId, userId }, {
      attempts: 1,    // không retry destroy — tránh xóa nhầm
    });
  }
}
```

---

## 6. Idle Detection

```typescript
// idle/idle.scheduler.ts
@Cron('* * * * *')   // mỗi 1 phút
async detectIdle() {
  const threshold = new Date(Date.now() - 10 * 60 * 1000); // 10 phút

  const stale = await this.projectsRepo
    .createQueryBuilder('p')
    .where('p.status = :s', { s: 'running' })
    .andWhere('p.last_active_at < :t', { t: threshold })
    .getMany();

  for (const p of stale) {
    await this.projectsRepo.update(p.id, { status: 'stopped' }); // optimistic
    await this.jobsProducer.enqueueStop(p.id, p.userId);
  }
}
```

**Cập nhật `last_active_at`:**
- Gateway container gửi `POST /api/internal/heartbeat` mỗi 5 phút khi có activity
- Nếu container không có activity = heartbeat không đến = idle detection tự nhiên xảy ra

---

## 7. Internal Endpoints (Worker ↔ Control Plane)

```typescript
// internal/internal.controller.ts
// Guard: kiểm tra header Authorization: Bearer {VPS_WORKER_SECRET}

@Post('status')
async updateStatus(@Body() dto: { projectId: string; status: string; containerName?: string }) {
  await this.projectsRepo.update(dto.projectId, {
    status: dto.status,
    containerName: dto.containerName,
  });
}

@Post('heartbeat')
async heartbeat(@Body() dto: { projectId: string }) {
  await this.projectsRepo.update(dto.projectId, {
    last_active_at: new Date(),
  });
}

// Dùng cho V2 auto-wake (wake-proxy gọi)
@Post('wake/:userId')
async wakeByUserId(@Param('userId') userId: string) {
  const project = await this.projectsRepo.findOne({ where: { userId, status: 'stopped' } });
  if (!project) return { ok: false, reason: 'not found or already running' };
  await this.projectsRepo.update(project.id, { status: 'starting' });
  await this.jobsProducer.enqueueWake(project.id, userId);
  return { ok: true, projectId: project.id };
}
```

---

## 8. Better-Auth Setup

```typescript
// auth/auth.module.ts
export const auth = betterAuth({
  database:       { provider: 'pg', url: process.env.DATABASE_URL },
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  session: {
    cookieOptions: { httpOnly: true, secure: true, sameSite: 'lax' },
  },
});

// Mount vào Fastify
fastify.all('/api/auth/*', (req, reply) =>
  auth.handler(req.raw, reply.raw)
);
```

---

## 9. Redis — Scale Path

```typescript
// database/redis.config.ts
// Chỉ đổi REDIS_URL là xong — BullMQ không cần thay đổi code

// Giai đoạn 1 (MVP): Railway managed Redis
// REDIS_URL=redis://default:password@railway-redis.railway.internal:6379

// Giai đoạn 2 (>10k users): Dedicated Redis VPS
// REDIS_URL=redis://default:password@redis-vps-ip:6379
```

---

## 10. Environment Variables

```env
# Railway
DATABASE_URL=postgresql://...
REDIS_URL=redis://...            ← Railway managed Redis

BETTER_AUTH_SECRET=...           ← random 32 bytes
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FRONTEND_URL=https://app.openclaw.ai

# Internal auth với VPS worker
VPS_WORKER_SECRET=...            ← shared secret, không expose public
```

---

## 11. Security

- Mọi `/api/projects/*` route đều qua `SessionGuard` — verify user sở hữu project trước khi action
- `/api/internal/*` chỉ nhận request có header `Authorization: Bearer {VPS_WORKER_SECRET}`
- Thêm rate limit register: max 5 attempts/IP/giờ (chống spam account)
- `DELETE /api/projects/:id` require confirm step ở frontend trước khi gọi
- Subdomain generation: `nanoid(8)` lowercase alphanumeric, check unique trước insert

---

## 12. Không làm cho MVP

| Feature | Khi nào |
|---|---|
| Billing / Stripe | Khi có paid tier |
| Multi-VPS node selector | Khi thêm VPS thứ 2 |
| Email notifications | Sprint 2 |
| Admin dashboard | Khi cần support users |
| API versioning | Khi có external API consumers |
