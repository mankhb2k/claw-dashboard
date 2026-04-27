# Function Registry — OpenClaw Backend

> Cập nhật mỗi khi thêm/sửa function. Mỗi file ghi: **nhiệm vụ file** + **từng function làm gì**.

---

## `src/main.ts`

**Nhiệm vụ:** Bootstrap NestJS app với Fastify adapter, đăng ký plugin và global middleware.

| Function | Mô tả |
|---|---|
| `bootstrap()` | Khởi tạo app, register CORS + cookie plugin, gắn global ValidationPipe / ResponseInterceptor / HttpExceptionFilter, setup Swagger, lắng nghe port |

---

## `src/app.module.ts`

**Nhiệm vụ:** Root module — import AuthModule, ProjectsModule, QueueModule, BillingModule, và các core modules. Không chứa logic.

---

## `src/app.controller.ts`

**Nhiệm vụ:** Endpoint health check cho Railway và placeholder root.

| Endpoint | Function | Mô tả |
|---|---|---|
| `GET /` | `getHello()` | Trả chuỗi "Hello World!" |
| `GET /health` | `health()` | Trả `{status:"ok", uptime}` |

---

## `src/app.service.ts`

**Nhiệm vụ:** Service đi kèm AppController.

| Function | Mô tả |
|---|---|
| `getHello()` | Trả chuỗi "Hello World!" |

---

## `src/core/database/prisma.service.ts`

**Nhiệm vụ:** Wrapper PrismaClient, inject vào NestJS DI, quản lý lifecycle kết nối DB. Dùng SQL adapter thay vì ORM query.

| Function | Mô tả |
|---|---|
| `constructor()` | Khởi tạo `new PrismaClient()` |
| `onModuleInit()` | Gọi `$connect()` khi NestJS khởi động |
| `onModuleDestroy()` | Gọi `$disconnect()` khi NestJS shutdown |

---

## `src/core/database/prisma.module.ts`

**Nhiệm vụ:** Global module export PrismaService — mọi module khác dùng được mà không cần import lại.

---

## `src/core/common/types/api-response.type.ts`

**Nhiệm vụ:** Định nghĩa kiểu dữ liệu response chuẩn toàn bộ API.

| Type | Mô tả |
|---|---|
| `ApiResponse<T>` | `{success: boolean, data?: T, error?: {code: string, message: string}}` |

---

## `src/core/common/interceptors/response.interceptor.ts`

**Nhiệm vụ:** Global interceptor — tự động bọc response controller vào format `ApiResponse`.

| Function | Mô tả |
|---|---|
| `intercept(ctx, next)` | Pipe qua `map()` — nếu chưa có format chuẩn thì bọc vào `{success:true, data}` |

---

## `src/core/common/filters/http-exception.filter.ts`

**Nhiệm vụ:** Global exception filter — bắt HttpException + mọi exception, trả về format `ApiResponse`.

| Function | Mô tả |
|---|---|
| `catch(exception, host)` | Xác định status code + message, trả về `{success:false, error:{code, message}}` với statusToCode mapping |
| `statusToCode(status)` _(private)_ | Map HTTP status → error code: 400→BAD_REQUEST, 401→UNAUTHENTICATED, 403→FORBIDDEN, 404→NOT_FOUND, 409→CONFLICT, 500→INTERNAL_ERROR |

---

## `src/core/common/decorators/current-user.decorator.ts`

**Nhiệm vụ:** Param decorator — trích xuất `req.user` (do SessionGuard gắn) thành tham số controller.

| Export | Mô tả |
|---|---|
| `CurrentUser` | Decorator factory — đọc `request.user` từ ExecutionContext |

---

## `src/core/common/validators/is-email-unique.validator.ts`

**Nhiệm vụ:** Async validator — kiểm tra email chưa được đăng ký trong DB.

| Method | Mô tả |
|---|---|
| `validate(email)` | Query DB, return `true` nếu email chưa tồn tại |
| `defaultMessage()` | Trả `Email "{email}" is already registered` |

---

## `src/core/common/validators/is-valid-cuid.validator.ts`

**Nhiệm vụ:** Sync validator — validate CUID format (lowercase alphanumeric).

| Method | Mô tả |
|---|---|
| `validate(value)` | Check regex `/^[a-z0-9]+$/` |
| `defaultMessage()` | Trả `Invalid ID format` |

---

## `src/core/common/validators/is-unique-subdomain.validator.ts`

**Nhiệm vụ:** Async validator — kiểm tra subdomain chưa được dùng trong DB + validate format (lowercase + hyphen, 1-63 chars).

| Method | Mô tả |
|---|---|
| `validate(subdomain)` | Check regex `/^[a-z0-9-]{1,63}$/` + query DB để tìm duplicate |
| `defaultMessage()` | Trả `Subdomain must be unique and contain only lowercase letters, numbers, and hyphens` |

---

## `src/core/common/common.module.ts`

**Nhiệm vụ:** Export tất cả custom validators (IsEmailUniqueValidator, IsValidCuidValidator, IsUniqueSubdomainValidator) để ProjectsModule dùng lại.

---

## `src/core/auth/better-auth.ts`

**Nhiệm vụ:** Khởi tạo Better Auth instance với Prisma adapter, cấu hình email/password và OAuth providers.

| Function | Mô tả |
|---|---|
| `createBetterAuth(prisma)` | Initialize Better Auth: Prisma adapter (PostgreSQL), email/password auth, conditional Google OAuth (nếu có env vars) |
| `getBaseUrl()` | Trả `API_URL` env hoặc default `http://localhost:3001` |
| `getTrustedOrigins()` | Trả array với `FRONTEND_URL` env hoặc default `http://localhost:3000` |

---

## `src/core/auth/auth.constants.ts`

**Nhiệm vụ:** Các hằng số auth — provider tokens, cookie names.

| Export | Mô tả |
|---|---|
| `BETTER_AUTH` | Injection token để inject Better Auth instance vào controller |

---

## `src/core/auth/auth.controller.ts`

**Nhiệm vụ:** HTTP handler proxy cho tất cả auth requests tới Better Auth handler.

| Endpoint | Function | Mô tả |
|---|---|---|
| `*` (all routes) | `handleAuth()` | Catch mọi request tới `/api/auth/*` → convert FastifyRequest/Response → call Better Auth handler → return response |

**Better Auth endpoints (auto-handled):**
- `POST /api/auth/sign-up` — Register with email/password
- `POST /api/auth/sign-in/email` — Login with email/password
- `GET /api/auth/sign-in/google` — Redirect sang Google OAuth
- `GET /api/auth/callback/google` — Google OAuth callback
- `POST /api/auth/sign-out` — Logout
- `GET /api/auth/session` — Get current session

---

## `src/core/auth/node-headers.util.ts`

**Nhiệm vụ:** Convert Fastify headers object sang Headers object cho Web Request.

| Function | Mô tả |
|---|---|
| `toHeaders(fastifyHeaders)` | Map raw headers để tương thích với Web Request |

---

## `src/core/auth/guards/session.guard.ts`

**Nhiệm vụ:** Guard — bảo vệ routes cần đăng nhập, gắn `req.user`.

| Function | Mô tả |
|---|---|
| `canActivate(ctx)` | Extract session từ cookies/headers → verify bằng Better Auth → gắn user vào `req.user`, throw 401 nếu không có session |

---

## `src/core/auth/auth.module.ts`

**Nhiệm vụ:** Setup Better Auth instance, export cho projects dùng SessionGuard. Import PrismaModule.

---

## `src/plugins/projects/dto/create-project.dto.ts`

**Nhiệm vụ:** DTO cho `POST /api/projects`. Để trống — subdomain auto-generate.

---

## `src/plugins/projects/dto/start-project.dto.ts`

**Nhiệm vụ:** DTO cho `POST /api/projects/:id/start`. Để trống.

---

## `src/plugins/projects/dto/stop-project.dto.ts`

**Nhiệm vụ:** DTO cho `POST /api/projects/:id/stop`. Để trống.

---

## `src/plugins/projects/projects.service.ts`

**Nhiệm vụ:** Business logic Projects — CRUD, vòng đời container, plan limit checks.

| Function | Mô tả |
|---|---|
| `findByUser(userId)` | Lấy tất cả projects của user, sort mới nhất trước |
| `create(userId, displayName)` | Check `maxProjects` + `maxConcurrentRunning` → generate subdomain → create Project (CREATING) → enqueue spawn |
| `getHealth(projectId, userId)` | Trả `{status, subdomain, lastActiveAt, storageUsedMb}` |
| `start(projectId, userId)` | Validate status STOPPED → update STARTING → enqueue wake |
| `stop(projectId, userId)` | Validate status RUNNING → update STOPPED → enqueue stop |
| `remove(projectId, userId)` | Validate not RUNNING → xóa Project (cascade) → enqueue destroy |
| `getInstances(projectId, userId)` | Lấy 20 ContainerInstance gần nhất |
| `updateProjectStatus(projectId, status, containerId?)` | Update project + instance status. Internal API dùng |
| `updateLastActiveAt(projectId, lastActiveAt)` | Update lastActiveAt timestamp |
| `findOwned(projectId, userId)` _(private)_ | Verify project ownership, throw 403 nếu unauthorized |
| `generateUniqueSubdomain()` _(private)_ | nanoid(8), retry tối đa 5 lần |

---

## `src/plugins/projects/projects.controller.ts`

**Nhiệm vụ:** HTTP handler Projects endpoints. Tất cả routes qua `@UseGuards(SessionGuard)`.

| Endpoint | Function | Mô tả |
|---|---|---|
| `GET /api/projects/mine` | `mine()` | Lấy danh sách projects của user |
| `POST /api/projects` | `create()` | Tạo project mới |
| `POST /api/projects/:id/start` | `start()` | Wake container |
| `POST /api/projects/:id/stop` | `stop()` | Stop container |
| `GET /api/projects/:id/health` | `health()` | Lấy trạng thái + domain |
| `GET /api/projects/:id/instances` | `instances()` | Lịch sử ContainerInstance |
| `DELETE /api/projects/:id` | `remove()` | Xóa project |

---

## `src/plugins/projects/projects.module.ts`

**Nhiệm vụ:** Import AuthModule, CommonModule, QueueModule. Export ProjectsService.

---

## `src/core/queue/queue.module.ts`

**Nhiệm vụ:** Configure BullMQ với Redis, register 2 queues.

| Queue | Jobs |
|---|---|
| `container-ops` | spawn, wake, stop, destroy |
| `heavy-tasks` | ffmpeg, playwright, tts, stt |

---

## `src/core/queue/queue.service.ts`

**Nhiệm vụ:** Enqueue jobs vào BullMQ.

**Container Operations:**

| Function | Job | Priority | Attempts | Timeout |
|---|---|---|---|---|
| `enqueueSpawn(projectId, userId, subdomain, imageVersion, cpuLimit, ramLimit)` | spawn | 5 | 3 | 2m |
| `enqueueWake(projectId, userId)` | wake | 1 (cao nhất) | 2 | 30s |
| `enqueueStop(projectId, userId)` | stop | 10 | 1 | 1m |
| `enqueueDestroy(projectId, userId)` | destroy | 5 | 0 | 2m |

**Heavy Tasks:**

| Function | Job | Timeout |
|---|---|---|
| `enqueueFFmpeg(userId, projectId, params)` | ffmpeg | 5m |
| `enqueuePlaywright(userId, projectId, params)` | playwright | 2m |
| `enqueueTTS(userId, projectId, params)` | tts | 2m |
| `enqueueSTT(userId, projectId, params)` | stt | 5m |

---

## `src/core/queue/queue-consumer.service.ts`

**Nhiệm vụ:** Mock VPS worker — process BullMQ jobs, update project status. Dev-only (disabled in production).

| Function | Mô tả |
|---|---|
| `onModuleInit()` | Init mock worker nếu `NODE_ENV !== 'production'` |
| `initializeMockWorker()` _(private)_ | Register queue processors |
| `handleQueueJob(job)` _(private)_ | Dispatch job.name → gọi simulate tương ứng |
| `simulateSpawn/Wake/Stop/Destroy()` _(private)_ | Delay → call updateProjectStatus() |
| `updateProjectStatus()` _(private)_ | POST `/api/internal/status` với `VPS_WORKER_SECRET` header |

---

## `src/core/billing/billing.service.ts`

**Nhiệm vụ:** Quản lý plan và subscription của user.

| Function | Mô tả |
|---|---|
| `getSubscription(userId)` | Tìm subscription của user, kèm plan info |
| `upsertSubscription(userId, planId)` | Upsert subscription sang plan tương ứng |

---

## `src/core/billing/plan-gate.service.ts`

**Nhiệm vụ:** Verify user quota against plan limits.

| Function | Mô tả |
|---|---|
| `getPlanForUser(userId)` | Resolve plan từ `subscription.plan`, throw nếu thiếu subscription |
| `assertProjectLimit(userId)` | Check `maxProjects`, throw CONFLICT nếu vượt |
| `assertConcurrentRunningLimit(userId)` | Check `maxConcurrentRunning`, throw CONFLICT nếu vượt |

---

## `src/core/billing/billing.module.ts`

**Nhiệm vụ:** Export billing services (`BillingService`, `PlanGateService`, `CreditService`).

---

## `src/core/billing/credit.service.ts`

**Nhiệm vụ:** Quản lý credit wallet (monthly/purchased), deduct/refund/grant và transaction log.

| Function | Mô tả |
|---|---|
| `getCost(tool)` | Trả credit cost theo tool |
| `getWallet(userId)` | Lấy hoặc khởi tạo wallet user |
| `listTransactions(userId, take)` | Lấy lịch sử credit transaction |
| `consumeForHeavyJob(userId, tool, heavyJobId, description)` | Trừ credit atomically, ghi `USAGE` transaction |
| `refundForHeavyJob(userId, heavyJobId, amount, description)` | Hoàn credit, ghi `REFUND` transaction |
| `grantMonthly(userId, credits, resetAt)` | Cấp monthly credits, ghi `MONTHLY_GRANT` transaction |

---

## `src/plugins/heavy-jobs/heavy-jobs.service.ts`

**Nhiệm vụ:** Submit, track, cancel heavy jobs. Credit wallet management (deduct/refund).

| Function | Mô tả |
|---|---|
| `submitJob(userId, projectId, tool, params)` | Resolve tool cost → create HeavyJob(PENDING, creditCost) → deduct credits atomically → enqueue |
| `getJobStatus(jobId, userId)` | Get job status + metadata |
| `cancelJob(jobId, userId)` | Cancel PENDING/PROCESSING jobs + refund credit |
| `listJobs(userId, projectId?)` | List jobs với optional filter |
| `getJobResult(jobId, userId)` | Get result (chỉ khi DONE) |
| `updateJobResult(jobId, status, resultPath, sizeMb, error)` | Internal: update job result; refund credit nếu FAILED |

---

## `src/plugins/heavy-jobs/heavy-jobs.controller.ts`

**Nhiệm vụ:** HTTP handler heavy jobs. Qua `@UseGuards(SessionGuard)`.

| Endpoint | Function | Mô tả |
|---|---|---|
| `POST /api/heavy/submit` | `submit()` | Submit heavy job |
| `GET /api/heavy/status/:jobId` | `getStatus()` | Lấy status |
| `GET /api/heavy/results/:jobId` | `getResult()` | Lấy result |
| `POST /api/heavy/cancel/:jobId` | `cancel()` | Cancel job |
| `GET /api/heavy/history` | `listJobs()` | Lịch sử |

---

## `src/plugins/heavy-jobs/mock-heavy-worker.service.ts`

**Nhiệm vụ:** Mock heavy job processor — simulate ffmpeg, playwright, tts, stt. Dev-only.

| Function | Mô tả |
|---|---|
| `initializeMockWorker()` | Register heavy-tasks queue processors |
| `processHeavyJob()` _(private)_ | Simulate processing + update result |

---

## `src/plugins/heavy-jobs/tool-registry.ts`

**Nhiệm vụ:** Tool metadata — timeouts, quotas, descriptions.

| Export | Mô tả |
|---|---|
| `TOOL_REGISTRY` | Map of tools with timeout, quota, description |

---

## `src/plugins/credits/credits.controller.ts`

**Nhiệm vụ:** HTTP handler cho credit APIs. Qua `@UseGuards(SessionGuard)`.

| Endpoint | Function | Mô tả |
|---|---|---|
| `GET /api/credits/wallet` | `wallet()` | Lấy wallet hiện tại |
| `GET /api/credits/history` | `history()` | Lấy lịch sử credit transactions |
| `GET /api/credits/cost/:tool` | `cost()` | Xem cost theo tool |

---

## `src/plugins/credits/credits.module.ts`

**Nhiệm vụ:** Wire controller credits, dùng `BillingModule` + `AuthModule`.

---

## `src/core/common/middleware/db-health.middleware.ts`

**Nhiệm vụ:** Health check middleware — verify DB connection before processing requests.

---

## `src/core/common/events/app-events.ts`

**Nhiệm vụ:** Define event types dùng cho event emitter system.

---

## `src/plugins/scheduler/idle-detection.service.ts`

**Nhiệm vụ:** Cron scheduler — auto-stop idle projects mỗi 1 phút. Plan-aware timeout.

| Function | Mô tả |
|---|---|
| `detectAndStopIdleProjects()` @Cron | Scan RUNNING projects, check lastActiveAt vs idle timeout (plan từ subscription), update STOPPED, enqueue stop |
| `triggerManual()` | Manual trigger từ `/api/internal/trigger-idle-detection` (dev/test) |

---

## AUTHENTICATION FLOW

**Better Auth handles:**
1. `POST /api/auth/sign-up` — Register with email/password
   - Email validator checks uniqueness (IsEmailUniqueValidator)
   - Password 8-128 chars
   - Creates User + Account records via Prisma
2. `POST /api/auth/sign-in/email` — Login
   - Email/password validation
   - Sets session cookie
3. `GET /api/auth/sign-in/google` — Google OAuth redirect
   - Configured via GOOGLE_CLIENT_ID/SECRET env vars
4. `GET /api/auth/callback/google` — OAuth callback
   - Creates user if new
   - Sets session cookie
5. `POST /api/auth/sign-out` — Logout
   - Clears session

**SessionGuard:**
- Validates session token from cookies/headers
- Attaches user to `req.user`
- Required for protected routes

---

## PROJECT LIFECYCLE

1. **Create:** POST /api/projects → enqueue spawn → status CREATING
2. **Running:** Mock worker → status RUNNING
3. **Stop:** POST /api/projects/:id/stop → enqueue stop → status STOPPED
4. **Start:** POST /api/projects/:id/start → enqueue wake → status RUNNING
5. **Idle Auto-Stop:** Cron checks lastActiveAt vs plan timeout → auto-stops
6. **Delete:** DELETE /api/projects/:id → enqueue destroy → cleanup

---

## Error codes

| Code | HTTP | Khi nào |
|---|---|---|
| `UNAUTHENTICATED` | 401 | Không có session / session hết hạn |
| `FORBIDDEN` | 403 | Có session nhưng không đủ quyền |
| `BAD_REQUEST` | 400 | Validation fail |
| `NOT_FOUND` | 404 | Resource không tồn tại |
| `CONFLICT` | 409 | Duplicate email/subdomain/plan limit |
| `INTERNAL_ERROR` | 500 | Server error |
