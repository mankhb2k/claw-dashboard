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

**Nhiệm vụ:** Root module — import PrismaModule, QueueModule, AuthModule, ProjectsModule, InternalModule, SubscriptionsModule. Không chứa logic.

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

## `src/prisma/prisma.service.ts`

**Nhiệm vụ:** Wrapper PrismaClient, inject vào NestJS DI, quản lý lifecycle kết nối DB.

| Function | Mô tả |
|---|---|
| `constructor()` | Khởi tạo `PrismaPg` adapter từ `DATABASE_URL`, truyền vào `super({adapter})` |
| `onModuleInit()` | Gọi `$connect()` khi NestJS khởi động |

---

## `src/prisma/prisma.module.ts`

**Nhiệm vụ:** Global module export PrismaService — mọi module khác dùng được mà không cần import lại.

---

## `src/common/types/api-response.type.ts`

**Nhiệm vụ:** Định nghĩa kiểu dữ liệu response chuẩn toàn bộ API.

| Function | Mô tả |
|---|---|
| `ok<T>(data)` | Tạo response thành công `{success:true, data, error:null}` |
| `fail(code, message)` | Tạo response lỗi `{success:false, data:null, error:{code, message}}` |

---

## `src/common/interceptors/response.interceptor.ts`

**Nhiệm vụ:** Global interceptor — tự động bọc response controller vào format `ApiResponse`.

| Function | Mô tả |
|---|---|
| `intercept(ctx, next)` | Pipe qua `map()` — nếu chưa có format chuẩn thì bọc vào `{success:true, data}` |

---

## `src/common/filters/http-exception.filter.ts`

**Nhiệm vụ:** Global exception filter — bắt HttpException + mọi exception, trả về format `ApiResponse`.

| Function | Mô tả |
|---|---|
| `catch(exception, host)` | Xác định status code + message, trả về `{success:false, error:{code, message}}` với statusToCode mapping |
| `statusToCode(status)` _(private)_ | Map HTTP status → error code: 400→BAD_REQUEST, 401→AUTH_UNAUTHENTICATED, 403→AUTH_FORBIDDEN, 404→NOT_FOUND, 409→CONFLICT, 500→INTERNAL_ERROR, etc. |

---

## `src/common/decorators/current-user.decorator.ts`

**Nhiệm vụ:** Param decorator — trích xuất `req.user` (do SessionGuard gắn) thành tham số controller.

| Export | Mô tả |
|---|---|
| `CurrentUser` | Decorator factory — đọc `request.user` từ ExecutionContext |

---

## `src/common/validators/is-email-unique.validator.ts`

**Nhiệm vụ:** Async validator — kiểm tra email chưa được đăng ký trong DB.

| Method | Mô tả |
|---|---|
| `validate(email)` | Query DB, return `true` nếu email chưa tồn tại |
| `defaultMessage()` | Trả `Email "{email}" is already registered` |

---

## `src/common/validators/is-valid-cuid.validator.ts`

**Nhiệm vụ:** Sync validator — validate CUID format (lowercase alphanumeric).

| Method | Mô tả |
|---|---|
| `validate(value)` | Check regex `/^[a-z0-9]+$/` |
| `defaultMessage()` | Trả `Invalid ID format` |

---

## `src/common/validators/is-unique-subdomain.validator.ts`

**Nhiệm vụ:** Async validator — kiểm tra subdomain chưa được dùng trong DB + validate format (lowercase + hyphen, 1-63 chars).

| Method | Mô tả |
|---|---|
| `validate(subdomain)` | Check regex `/^[a-z0-9-]{1,63}$/` + query DB để tìm duplicate |
| `defaultMessage()` | Trả `Subdomain must be unique and contain only lowercase letters, numbers, and hyphens` |

---

## `src/common/common.module.ts`

**Nhiệm vụ:** Export tất cả custom validators (IsEmailUniqueValidator, IsValidCuidValidator, IsUniqueSubdomainValidator) để AuthModule, ProjectsModule dùng lại.

---

## `src/auth/auth.utils.ts`

**Nhiệm vụ:** Các hàm tiện ích auth dùng Node.js built-in `crypto`.

| Function | Mô tả |
|---|---|
| `hashPassword(plain)` | Hash password dùng `crypto.scrypt` + random salt 16 bytes, trả `salt:hash` |
| `verifyPassword(plain, stored)` | So sánh với hash đã lưu, dùng `timingSafeEqual` chống timing attack |
| `generateSessionToken()` | Tạo session token ngẫu nhiên 32 bytes hex (64 ký tự) |
| `sessionExpiresAt(days?)` | Tính thời điểm hết hạn, mặc định 30 ngày từ hiện tại |

---

## `src/auth/google.oauth.ts`

**Nhiệm vụ:** Thực hiện Google OAuth2 flow thủ công dùng `fetch`.

| Function | Mô tả |
|---|---|
| `buildGoogleAuthUrl(redirectUri, state)` | Tạo URL redirect sang Google OAuth consent screen |
| `exchangeCodeForTokens(code, redirectUri)` | POST tới Google token endpoint, đổi `code` lấy `access_token` + `id_token` |
| `getGoogleUserInfo(accessToken)` | GET Google userinfo endpoint, lấy `{email, name, picture, sub}` |

---

## `src/auth/auth.service.ts`

**Nhiệm vụ:** Business logic toàn bộ auth — register, login, logout, session, Google OAuth.

| Function | Mô tả |
|---|---|
| `register(email, password, name)` | Kiểm tra email tồn tại → hash password → tạo User + Account(email) → tạo session |
| `login(email, password)` | Tìm user + account → verify password → tạo session mới |
| `logout(token)` | Xóa session khỏi DB theo token |
| `getSession(token)` | Tìm session trong DB, kiểm tra chưa expired, trả `{user, session}` |
| `getGoogleRedirectUrl(state)` | Gọi `buildGoogleAuthUrl` với redirectUri từ `API_URL` env |
| `handleGoogleCallback(code)` | Đổi code → lấy user info → tìm/tạo User + Account(google) → tạo session |
| `createSession(userId)` _(private)_ | Tạo Session record trong DB, trả `{user, token, expiresAt}` |
| `googleRedirectUri()` _(private)_ | Build `{API_URL}/api/auth/callback/google` |
| `cookieName()` _(static)_ | Trả `"session_token"` — dùng chung giữa service và controller |

---

## `src/auth/auth.controller.ts`

**Nhiệm vụ:** HTTP handler cho tất cả auth endpoints.

| Endpoint | Function | Mô tả |
|---|---|---|
| `POST /api/auth/register` | `register()` | Validate body → service.register → set cookie → trả user |
| `POST /api/auth/login` | `login()` | Validate body → service.login → set cookie → trả user |
| `POST /api/auth/logout` | `logout()` | Đọc cookie → service.logout → clear cookie |
| `GET /api/auth/session` | `session()` | Đọc cookie → service.getSession → trả user |
| `GET /api/auth/sign-in/google` | `signInGoogle()` | Redirect 302 sang Google OAuth URL |
| `GET /api/auth/callback/google` | `googleCallback()` | Nhận code → service.handleGoogleCallback → set cookie → redirect frontend |
| _(private)_ | `setSessionCookie()` | Set httpOnly cookie với token + expiresAt, secure=true khi production |
| _(private)_ | `sanitizeUser()` | Trả chỉ id/name/email/image/emailVerified/createdAt, bỏ field nhạy cảm |

---

## `src/auth/guards/session.guard.ts`

**Nhiệm vụ:** Guard — bảo vệ routes cần đăng nhập, gắn `req.user`.

| Function | Mô tả |
|---|---|
| `canActivate(ctx)` | Đọc `session_token` cookie → authService.getSession → gắn user vào `req.user` |

---

## `src/auth/dto/register.dto.ts`

**Nhiệm vụ:** Validate body cho `POST /api/auth/register`.

| Property | Validator | Mô tả |
|---|---|---|
| `email` | `@IsEmail()`, `@Validate(IsEmailUniqueValidator)` | Email hợp lệ, chưa đăng ký |
| `password` | `@MinLength(8)`, `@MaxLength(128)` | 8–128 ký tự |
| `name` | `@MinLength(1)`, `@MaxLength(100)` | 1–100 ký tự |

---

## `src/auth/dto/login.dto.ts`

**Nhiệm vụ:** Validate body cho `POST /api/auth/login`.

| Property | Validator | Mô tả |
|---|---|---|
| `email` | `@IsEmail()` | Email hợp lệ |
| `password` | `@MinLength(1)`, `@MaxLength(128)` | Không được trống |

---

## `src/auth/auth.module.ts`

**Nhiệm vụ:** Export AuthService + SessionGuard để ProjectsModule, InternalModule dùng. Import CommonModule cho validators.

---

## `src/projects/dto/create-project.dto.ts`

**Nhiệm vụ:** DTO cho `POST /api/projects`. Để trống — subdomain auto-generate.

---

## `src/projects/dto/start-project.dto.ts`

**Nhiệm vụ:** DTO cho `POST /api/projects/:id/start`. Để trống — request body validation.

---

## `src/projects/dto/stop-project.dto.ts`

**Nhiệm vụ:** DTO cho `POST /api/projects/:id/stop`. Để trống — request body validation.

---

## `src/projects/projects.service.ts`

**Nhiệm vụ:** Business logic toàn bộ Projects — CRUD, vòng đời container, plan limit, internal callbacks.

| Function | Mô tả |
|---|---|
| `findByUser(userId)` | Lấy tất cả projects của user, kèm plan info, sort mới nhất trước |
| `create(userId)` | Lấy plan từ user subscription (hoặc free plan default) → check maxProjects limit → generate subdomain → tạo Project (CREATING) + ContainerInstance → enqueue spawn |
| `getHealth(projectId, userId)` | Trả `{status, subdomain, lastActiveAt, storageUsedMb}` |
| `start(projectId, userId)` | Validate status → update STARTING → tạo ContainerInstance mới → enqueue wake |
| `stop(projectId, userId)` | Validate status → update STOPPED → update ContainerInstance active → enqueue stop |
| `remove(projectId, userId)` | Chặn xóa khi RUNNING → xóa Project (cascade ContainerInstance) → enqueue destroy |
| `getInstances(projectId, userId)` | Lấy 20 ContainerInstance gần nhất, sort mới nhất trước |
| `updateProjectStatus(projectId, status, containerId?)` | Update project status; nếu có containerId thì update ContainerInstance luôn. Dùng bởi InternalController |
| `updateLastActiveAt(projectId, lastActiveAt)` | Update lastActiveAt timestamp. Dùng bởi InternalController heartbeat |
| `findOwned(projectId, userId)` _(private)_ | Tìm project, throw 404 nếu không tồn tại, throw 403 nếu không phải owner |
| `getPlanForUser(userId)` _(private)_ | Tìm subscription của user, nếu có thì dùng plan đó; không có thì fallback getFreePlan |
| `getFreePlan()` _(private)_ | Lấy plan `"free"` từ DB, throw nếu chưa seed |
| `generateUniqueSubdomain()` _(private)_ | `nanoid(8).toLowerCase()`, retry tối đa 5 lần nếu trùng |

---

## `src/projects/projects.controller.ts`

**Nhiệm vụ:** HTTP handler cho Projects endpoints. Tất cả routes qua `@UseGuards(SessionGuard)`.

| Endpoint | Function | Mô tả |
|---|---|---|
| `GET /api/projects/mine` | `mine()` | Lấy danh sách projects của user đang login |
| `POST /api/projects` | `create()` | Tạo project mới |
| `POST /api/projects/:id/start` | `start()` | Wake container |
| `POST /api/projects/:id/stop` | `stop()` | Stop container |
| `GET /api/projects/:id/health` | `health()` | Lấy trạng thái + domain |
| `GET /api/projects/:id/instances` | `instances()` | Lịch sử ContainerInstance |
| `DELETE /api/projects/:id` | `remove()` | Xóa project (phải stop trước) |

---

## `src/projects/projects.module.ts`

**Nhiệm vụ:** Import AuthModule (SessionGuard), CommonModule (validators), QueueModule (QueueService). Export ProjectsService cho InternalModule dùng.

---

## `src/queue/queue.module.ts`

**Nhiệm vụ:** Configure BullMQ với Redis, register 2 queues. Parse `REDIS_URL` tự động, fallback sang REDIS_HOST/PORT/PASSWORD.

| Queue | Jobs |
|---|---|
| `container-ops` | spawn, wake, stop, destroy |
| `heavy-tasks` | ffmpeg, playwright, tts, stt |

---

## `src/queue/queue.service.ts`

**Nhiệm vụ:** Enqueue jobs vào BullMQ. 2 queues: container-ops và heavy-tasks.

**Container Operations:**

| Function | Job | Priority | Attempts | Timeout |
|---|---|---|---|---|
| `enqueueSpawn(projectId, userId, subdomain, imageVersion, cpuLimit, ramLimit)` | spawn | 5 | 3 | 2m |
| `enqueueWake(projectId, userId)` | wake | 1 (cao nhất) | 2 | 30s |
| `enqueueStop(projectId, userId)` | stop | 10 (thấp nhất) | 1 | 1m |
| `enqueueDestroy(projectId, userId)` | destroy | 5 | 0 (no retry) | 2m |

**Heavy Tasks:**

| Function | Job | Return | Timeout |
|---|---|---|---|
| `enqueueFFmpeg(userId, projectId, params)` | ffmpeg | jobId | 5m |
| `enqueuePlaywright(userId, projectId, params)` | playwright | jobId | 2m |
| `enqueueTTS(userId, projectId, params)` | tts | jobId | 2m |
| `enqueueSTT(userId, projectId, params)` | stt | jobId | 5m |

**Queue Stats:**

| Function | Mô tả |
|---|---|
| `getContainerOpsQueueStats()` | Trả `{total, delayed, active, failed}` cho container-ops |
| `getHeavyTasksQueueStats()` | Trả `{total, delayed, active, failed}` cho heavy-tasks |

---

## `src/queue/queue-consumer.service.ts`

**Nhiệm vụ:** Mock VPS worker — subscribe to BullMQ `container-ops` queue, simulate job processing, gọi Internal API để update project status. Chỉ chạy khi `NODE_ENV !== 'production'`.

| Function | Mô tả |
|---|---|
| `onModuleInit()` | Lifecycle hook — init mock worker nếu không phải production |
| `initializeMockWorker()` _(private)_ | Register `queue.process()` handler + listen global:completed/failed events |
| `handleQueueJob(job)` _(private)_ | Dispatch theo job.name → gọi simulate tương ứng |
| `simulateSpawn(projectId, userId, data)` _(private)_ | Delay 1s → generate mock containerId → call updateProjectStatus(RUNNING) |
| `simulateWake(projectId, userId)` _(private)_ | Delay 1s → call updateProjectStatus(RUNNING) |
| `simulateStop(projectId, userId)` _(private)_ | Delay 1s → call updateProjectStatus(STOPPED) |
| `simulateDestroy(projectId, userId)` _(private)_ | Delay 1s → call updateProjectStatus(DESTROYING) |
| `updateProjectStatus(projectId, status, containerId?)` _(private)_ | POST `http://localhost:{PORT}/api/internal/status` với header `Authorization: Bearer {VPS_WORKER_SECRET}` |
| `delay(ms)` _(private)_ | `new Promise(resolve => setTimeout(resolve, ms))` |

---

## `src/internal/guards/worker-secret.guard.ts`

**Nhiệm vụ:** Guard — bảo vệ Internal API, verify `Authorization: Bearer {VPS_WORKER_SECRET}`.

| Function | Mô tả |
|---|---|
| `canActivate(ctx)` | Parse header `Bearer {secret}` → so sánh với `VPS_WORKER_SECRET` env → throw 401/403 nếu sai |

**Exceptions:** `UnauthorizedException` (401) nếu header missing/sai format — `ForbiddenException` (403) nếu secret sai.

---

## `src/internal/dtos/update-status.dto.ts`

**Nhiệm vụ:** Validate body cho `POST /api/internal/status`. Export `ProjectStatus` enum.

| Property | Validator | Mô tả |
|---|---|---|
| `projectId` | `@IsString()` | Project ID |
| `status` | `@IsEnum(ProjectStatus)` | CREATING / RUNNING / STARTING / STOPPED / STOPPING / ERROR / DESTROYING |
| `containerId?` | `@IsOptional()`, `@IsString()` | Container ID từ mock worker |

---

## `src/internal/dtos/update-heartbeat.dto.ts`

**Nhiệm vụ:** Validate body cho `POST /api/internal/heartbeat`.

| Property | Validator | Mô tả |
|---|---|---|
| `projectId` | `@IsString()` | Project ID |
| `lastActiveAt` | `@IsISO8601()` | Timestamp ISO8601 |

---

## `src/internal/internal.controller.ts`

**Nhiệm vụ:** HTTP handler cho Internal API. Tất cả routes qua `@UseGuards(WorkerSecretGuard)`. Phase 3: thêm endpoint test trigger-idle-detection.

| Endpoint | Function | Mô tả |
|---|---|---|
| `POST /api/internal/status` | `updateStatus(dto)` | Gọi `projectsService.updateProjectStatus()`, trả `{projectId, status}` |
| `POST /api/internal/heartbeat` | `updateHeartbeat(dto)` | Gọi `projectsService.updateLastActiveAt()`, trả `{projectId, lastActiveAt}` |
| `POST /api/internal/trigger-idle-detection` | `triggerIdleDetection()` | (Dev/Test only) Gọi IdleDetectionService.triggerManual(), trả `{success: true}` |

---

## `src/internal/internal.module.ts`

**Nhiệm vụ:** Import ProjectsModule để dùng ProjectsService trong InternalController.

---

## `src/subscriptions/subscriptions.service.ts`

**Nhiệm vụ:** Quản lý subscription plan của user — get/upsert.

| Function | Mô tả |
|---|---|
| `getSubscription(userId)` | Tìm subscription của user, kèm plan info. Trả null nếu không tồn tại |
| `upsertSubscription(userId, planId)` | Tạo hoặc update subscription: nếu chưa có thì create, có rồi thì update planId. Throw NotFoundException nếu planId không tồn tại |

---

## `src/subscriptions/subscriptions.module.ts`

**Nhiệm vụ:** Export SubscriptionsService để ProjectsModule dùng.

---

## `src/scheduler/idle-detection.service.ts` (Phase 3 — Day 11)

**Nhiệm vụ:** Cron scheduler — chạy mỗi 1 phút để scan projects idle và auto-stop. Integratedbây giờ với idle timeout từ plan.

| Function | Mô tả |
|---|---|
| `@Cron('*/1 * * * *')` `detectAndStopIdleProjects()` | Chạy mỗi 1 phút: query projects RUNNING, so sánh lastActiveAt < now - idleTimeoutMin, update status → STOPPING, enqueue stop job (priority=10) |
| `triggerManual()` | Gọi detectAndStopIdleProjects() từ endpoint test `/api/internal/trigger-idle-detection` |

---

## `src/scheduler/scheduler.module.ts` (Phase 3)

**Nhiệm vụ:** Register ScheduleModule (NestJS @nestjs/schedule), provide IdleDetectionService, export cho InternalModule dùng.

---

## `src/app.module.ts` (Updated Phase 3)

**Nhiệm vụ:** Root module — import thêm SchedulerModule (ngoài PrismaModule, QueueModule, AuthModule, ProjectsModule, InternalModule, SubscriptionsModule).

---

## `src/heavy-jobs/heavy-jobs.service.ts` (Phase 4 — Day 15)

**Nhiệm vụ:** Business logic toàn bộ heavy jobs — submit, status, cancel, result, list. Quản lý quota hàng ngày theo plan.

| Function | Mô tả |
|---|---|
| `submitJob(userId, projectId, tool, params)` | Verify project ownership → check dailyquota → create HeavyJob (PENDING) → enqueue to BullMQ heavy-tasks |
| `getJobStatus(jobId, userId)` | Lấy status của job, verify ownership, trả {status, submittedAt, completedAt, resultPath, error} |
| `cancelJob(jobId, userId)` | Verify ownership, check status (PENDING/PROCESSING) → update to CANCELLED |
| `listJobs(userId, projectId?)` | Lấy danh sách jobs của user, kèm optional projectId filter, max 50, sort mới nhất trước |
| `getJobResult(jobId, userId)` | Verify ownership, check status = DONE → trả {resultPath, resultSizeMb, completedAt} |
| `updateJobResult(jobId, status, resultPath, sizeMb, error)` | Internal: update job result sau khi heavy worker xử lý xong |
| `getToolTimeout(tool)` _(private)_ | Return timeout: FFMPEG=5m, PLAYWRIGHT=2m, TTS=2m, STT=5m |
| `getEstimatedWait(tool)` _(private)_ | Return estimated wait time: FFMPEG="2-5min", PLAYWRIGHT="30-60s", etc |

---

## `src/heavy-jobs/heavy-jobs.controller.ts` (Phase 4 — Day 16)

**Nhiệm vụ:** HTTP handler cho Heavy Jobs endpoints. Tất cả routes qua `@UseGuards(SessionGuard)`.

| Endpoint | Function | Mô tả |
|---|---|---|
| `POST /api/heavy/submit` | `submit()` | Submit heavy job: {projectId, tool, params} → service.submitJob → trả {jobId, status, estimatedWait} |
| `GET /api/heavy/status/:jobId` | `getStatus()` | Lấy status của job |
| `GET /api/heavy/results/:jobId` | `getResult()` | Lấy kết quả (chỉ khi DONE) |
| `POST /api/heavy/cancel/:jobId` | `cancel()` | Hủy job (PENDING/PROCESSING) |
| `GET /api/heavy/history` | `listJobs()` | Lịch sử jobs, optional filter by projectId |

---

## `src/heavy-jobs/mock-heavy-worker.service.ts` (Phase 4 — Day 16)

**Nhiệm vụ:** Mock VPS Heavy worker — subscribe to BullMQ `heavy-tasks` queue, simulate job processing, update job result trong DB. Chỉ chạy khi `NODE_ENV !== 'production'`.

| Function | Mô tả |
|---|---|
| `initializeMockWorker()` | Lifecycle: register handlers cho ffmpeg, playwright, tts, stt jobs. Listen on completed/failed events |
| `processHeavyJob(job, tool, delayMs)` _(private)_ | Simulate processing: delay Xms → generate mock result → call heavyJobsService.updateJobResult(DONE) |

---

## `src/heavy-jobs/dto/submit-heavy-job.dto.ts` (Phase 4)

**Nhiệm vụ:** Validate body cho `POST /api/heavy/submit`.

| Property | Validator | Mô tả |
|---|---|---|
| `projectId` | `@IsString()`, `@IsNotEmpty()` | Project ID |
| `tool` | `@IsEnum()` | FFMPEG / PLAYWRIGHT / TTS / STT |
| `params` | `@IsObject()`, `@IsNotEmpty()` | Tool-specific parameters |

---

## Phase 4 Architecture (Days 15-17)

**Heavy Jobs Quota (from Plan):**
- Free: 3 heavy jobs/day
- Pro: 100 heavy jobs/day

**Heavy Tools & Timeouts:**
- FFmpeg: 5 min timeout, 100-500MB output
- Playwright: 2 min timeout, 2-50MB output
- TTS: 2 min timeout, 1-10MB output
- STT: 5 min timeout, <1MB output

**Job Lifecycle:**
1. User submits job via POST /api/heavy/submit
2. Service verifies quota → creates HeavyJob (PENDING) → enqueues to BullMQ
3. Mock heavy worker simulates processing
4. Updates job result in DB (DONE/FAILED)
5. User retrieves result via GET /api/heavy/results/:jobId

---

## E2E Test Scenarios (Phase 3 — Days 11-14)

| Scenario | Location | Test Cases |
|---|---|---|
| Scenario 1: Idle Detection Auto-Stop (Free 10m) | `test/idle-detection.e2e.spec.ts` | Create project → set lastActiveAt = 11m ago → POST trigger-idle-detection → status = STOPPED |
| Scenario 2: Idle Detection Preserves Pro (60m) | `test/idle-detection.e2e.spec.ts` | Create pro project → set lastActiveAt = 50m ago → trigger → status stays RUNNING |
| Scenario 3: Heartbeat Prevents Idle | `test/heartbeat.e2e.spec.ts` | Create → set lastActiveAt = 10m ago → POST heartbeat → lastActiveAt updates → trigger idle → still RUNNING |
| Scenario 4: Concurrent Start Idempotency | `test/concurrent.e2e.spec.ts` | Click start 2x fast → should only enqueue 1 wake job → status = STARTING then RUNNING |
| Scenario 5: Error State Recovery | `test/error-handling.e2e.spec.ts` | Project ERROR → user clicks start → enqueue wake → status = STARTING then RUNNING |
| Scenario 6: Instance History Audit Trail | `test/instance-history.e2e.spec.ts` | Create → start → stop → GET instances → see all ContainerInstance records with timestamps |

---

## Phase 2 E2E Test Scenarios (Day 10)

| Scenario | Location | Test Cases |
|---|---|---|
| Scenario 1: Register → Create → Check → Delete | `test/projects.e2e.spec.ts` | User flow: create project, check health, delete |
| Scenario 2: Create 2 Projects → List → Start/Stop | `test/projects.e2e.spec.ts` | Create 1st (201), create 2nd (409), stop, start |
| Scenario 3: Free Plan Limit (max 1) | `test/projects.e2e.spec.ts` | 1st project succeeds (201), 2nd fails (409 CONFLICT) |
| Scenario 4: Cross-User Access (403 Forbidden) | `test/projects.e2e.spec.ts` | User2 cannot access User1's project (403 AUTH_FORBIDDEN) |
| Scenario 5: Mock Worker Auto-Update | `test/projects.e2e.spec.ts` | In dev: job → 2s delay → status updated. In test: disabled. |

---

## Bảng tổng hợp theo chức năng

| Chức năng | Files |
|---|---|
| Bootstrap | `main.ts`, `app.module.ts` |
| Health check | `app.controller.ts`, `app.service.ts` |
| Response format | `common/types/api-response.type.ts`, `common/interceptors/response.interceptor.ts`, `common/filters/http-exception.filter.ts` |
| Auth | `auth/auth.utils.ts`, `auth/auth.service.ts`, `auth/auth.controller.ts` |
| Auth DTOs | `auth/dto/register.dto.ts`, `auth/dto/login.dto.ts` |
| Google OAuth | `auth/google.oauth.ts` |
| Session guard | `auth/guards/session.guard.ts` |
| Custom validators | `common/validators/is-email-unique.validator.ts`, `common/validators/is-valid-cuid.validator.ts` |
| Current user decorator | `common/decorators/current-user.decorator.ts` |
| Projects CRUD | `projects/projects.service.ts`, `projects/projects.controller.ts`, `projects/dto/*.ts` |
| Subscriptions | `subscriptions/subscriptions.service.ts`, `subscriptions/subscriptions.module.ts` |
| Validators | `common/validators/is-*.validator.ts` |
| Queue jobs | `queue/queue.service.ts` |
| Mock VPS worker | `queue/queue-consumer.service.ts` |
| Internal API | `internal/internal.controller.ts`, `internal/guards/worker-secret.guard.ts` |
| Integration Tests | `test/projects.e2e.spec.ts` (5 Day 10 scenarios) |
| DB | `prisma/prisma.service.ts`, `prisma/prisma.module.ts` |

---

## Error codes

| Code | HTTP | Khi nào |
|---|---|---|
| `AUTH_UNAUTHENTICATED` | 401 | Không có session / session hết hạn |
| `AUTH_FORBIDDEN` | 403 | Có session nhưng không đủ quyền |
| `BAD_REQUEST` | 400 | Validation fail / input sai |
| `NOT_FOUND` | 404 | Resource không tồn tại |
| `CONFLICT` | 409 | Duplicate (email, subdomain, v.v.) |
| `INTERNAL_ERROR` | 500 | Lỗi server không xác định |
