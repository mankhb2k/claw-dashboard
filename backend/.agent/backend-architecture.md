# OpenClaw SaaS — Backend (Control Plane)

> **Stack:** NestJS · Fastify · PostgreSQL (Neon) · Redis · BullMQ · Prisma ORM  
> **Deploy:** Railway  
> **Vai trò:** Auth · Quản lý projects · Điều phối containers · Enqueue jobs · Idle detection · KHÔNG chạy containers trực tiếp

---

## 1. Công nghệ & Lý do chọn

| Công nghệ | Vai trò | Lý do |
|---|---|---|
| **NestJS** | Web framework | Module hóa, DI pattern, TypeScript first — dễ scale team |
| **Fastify** | HTTP adapter | ~2× nhanh hơn Express, built-in schema validation, plugin ecosystem tốt |
| **PostgreSQL (Neon)** | Database chính | ACID, relations phức tạp, partial index, serverless-friendly với Neon |
| **Prisma ORM** | DB client | Type-safe query, migration tự động, schema-first workflow |
| **Redis** | Message broker + cache | BullMQ dùng Redis làm backbone queue, persistent, pub/sub sẵn |
| **BullMQ** | Job queue | Priority queue, retry, delayed jobs, dead-letter — chỉ enqueue ở đây, VPS consume |
| **@fastify/cookie** | Session cookie | httpOnly cookie — session token lưu DB thay vì JWT |
| **crypto (built-in)** | Auth utils | scrypt hash + timingSafeEqual — không phụ thuộc thư viện bên ngoài |

---

## 2. Database Schema

### Quan hệ tổng quan

```
User ──< Account                  (1 user nhiều OAuth provider)
User ──< Session                  (1 user nhiều thiết bị)
User ──< Project                  (1 user nhiều project, giới hạn bởi plan.maxProjects)
User ──  Subscription ── Plan     (1 user 1 subscription → plan)
User ──  UserCredits              (1 user 1 credit wallet)
User ──< CreditTransaction        (audit trail biến động credit)
User ──< Invoice                  (lịch sử thanh toán subscription)
User ──< HeavyJob                 (credit check + deduct theo userId cross-project)
Project ──< ContainerInstance     (lịch sử instance của project)
Project ──< HeavyJob              (để biết job từ project nào)
Plan ──< Subscription
CreditPack ──< CreditTransaction  (khi type = PURCHASE)
HeavyJob ──< CreditTransaction    (khi type = USAGE hoặc REFUND)
```

> **Quan trọng:** `Project` KHÔNG có relation trực tiếp đến `Plan`.
> Plan của project được resolve qua: `Project → userId → Subscription → Plan`.
> Heavy job quota dùng credit balance của user, không phải daily counter.

---

### Bảng: `users`
Tài khoản người dùng — Better-Auth compatible schema.

| Column | Type | Mô tả |
|---|---|---|
| id | cuid | PK |
| name | String | Tên hiển thị |
| email | String UNIQUE | Email đăng nhập |
| emailVerified | Boolean | Đã xác minh email chưa |
| image | String? | Avatar URL |
| stripeCustomerId | String? UNIQUE | Stripe customer ID — set khi upgrade Pro |
| createdAt / updatedAt | Timestamp | Audit trail |

---

### Bảng: `accounts`
OAuth provider accounts — 1 user có thể link nhiều provider.

| Column | Type | Mô tả |
|---|---|---|
| accountId | String | ID tại provider (email hoặc Google sub) |
| providerId | String | `"email"` hoặc `"google"` |
| password | String? | Hash scrypt — chỉ có khi providerId = email |
| accessToken / refreshToken | String? | OAuth tokens |
| expiresAt | DateTime? | Token expiry |

**Index:** `(userId)` — query nhanh accounts của 1 user

---

### Bảng: `sessions`
Session tokens lưu DB — không dùng JWT để dễ revoke.

| Column | Type | Mô tả |
|---|---|---|
| token | String UNIQUE | Random 32-byte hex — lưu trong httpOnly cookie |
| expiresAt | DateTime | 30 ngày từ lúc tạo |
| ipAddress / userAgent | String? | Audit, phát hiện session bất thường |

**Lý do dùng DB session thay JWT:** revoke ngay lập tức, không cần blacklist, phù hợp MVP.

---

### Bảng: `plans`
Gói dịch vụ — seed data, không thay đổi thường xuyên.

| Column | Type | Mô tả |
|---|---|---|
| name | String UNIQUE | `"free"` hoặc `"pro"` |
| maxProjects | Int | Số project tối đa user được tạo |
| maxConcurrentRunning | Int | Số container chạy đồng thời tối đa của user |
| ramMb | Int | RAM mỗi container (MB) |
| cpuVcpu | Decimal | CPU limit (vCPU) |
| storageGb | Int | Storage quota mỗi project (GB) |
| monthlyCredits | Int | Credits tặng mỗi tháng (reset ngày billing anniversary) — 0 = không có heavy jobs |
| maxKeepAliveProjects | Int | Số project được giữ keep-alive (tier-B channel) tối đa |
| idleTimeoutMin | Int | Idle timeout (phút) áp dụng cho toàn bộ projects của user |
| priceMonthly | Int | Giá tháng (USD cents), 0 = free |
| stripeProductId / stripePriceId | String? | Mapping sang Stripe khi tích hợp billing |

> **Bỏ `heavyJobsPerDay`** — thay bằng credit system. Quota không còn tính theo ngày
> mà tính theo credit balance của user.

**Seed data tham chiếu:**

| | Free | Pro |
|---|---|---|
| maxProjects | 1 | 3 |
| maxConcurrentRunning | 1 | 3 |
| ramMb | 1024 | 2048 |
| cpuVcpu | 0.5 | 1.0 |
| storageGb | 4 | 10 |
| **monthlyCredits** | **0** | **200** |
| maxKeepAliveProjects | 0 | 1 |
| idleTimeoutMin | 10 | 60 |
| priceMonthly | 0 | 2000 |

---

### Bảng: `projects`
Một project = một logical workspace của user, ánh xạ 1-1 với subdomain.

> **Thiết kế quan trọng:** Project KHÔNG lưu `planId`. Plan được resolve qua
> `project → user → subscription → plan`. Điều này đảm bảo khi user upgrade/downgrade,
> toàn bộ project được áp dụng plan mới ngay lập tức mà không cần migration data.

| Column | Type | Mô tả |
|---|---|---|
| userId | FK | Owner |
| subdomain | String UNIQUE | `abc123.openclaw.ai` — nanoid(8) |
| containerName | String? | Docker container name hiện tại |
| status | Enum | `CREATING · RUNNING · STOPPED · STARTING · ERROR` |
| lastActiveAt | DateTime | Cập nhật mỗi heartbeat — idle detection dựa vào đây |
| keepAlive | Boolean | `true` khi có tier-B channel active (Discord, WhatsApp...) |
| vpsId | String | VPS đang host container — sẵn sàng multi-VPS |
| storageUsedMb | Int | Track quota storage của project này |
| errorMessage | String? | Lý do lỗi cuối cùng |

**Indexes:**
- `(userId)` — query projects của 1 user
- `(lastActiveAt) WHERE status = RUNNING` — partial index, idle detection scan nhanh
- `(keepAlive) WHERE keepAlive = true` — query keep-alive projects nhanh

**Lý do bỏ `heavyQuotaUsed`:** quota heavy job là tổng toàn bộ projects của user,
không thể track per-project. Thay bằng cách đếm từ bảng `heavy_jobs` theo `userId + ngày`.

---

### Bảng: `container_instances` ← MỚI
Lịch sử từng lần chạy container — mỗi start tạo 1 record mới, không overwrite.

| Column | Type | Mô tả |
|---|---|---|
| projectId | FK | Project sở hữu |
| containerId | String? | Docker container ID thật (64-char hex) — dùng để gọi Docker API |
| imageVersion | String | Phiên bản image lúc spawn, vd: `"openclaw:1.4.2"` |
| cpuLimit | Decimal | Snapshot CPU limit tại thời điểm spawn — tránh inconsistency khi đổi plan |
| ramLimit | Int | Snapshot RAM limit |
| status | Enum | `STARTING · RUNNING · STOPPING · STOPPED · ERROR · DESTROYED` |
| nodeId | String | VPS đang chạy — `"vps-1"`, `"vps-2"` |
| exitCode | Int? | Docker exit code — 0 = bình thường, khác 0 = crash |
| errorMessage | String? | Lý do lỗi nếu status = ERROR |
| startedAt | DateTime? | Thời điểm container thực sự RUNNING |
| stoppedAt | DateTime? | Thời điểm container dừng |
| createdAt | DateTime | Thời điểm record được tạo (lúc enqueue spawn) |

**Tại sao snapshot cpuLimit/ramLimit:** nếu user upgrade plan khi container đang chạy, record này vẫn phản ánh đúng resource đã cấp phát — tránh audit sai.

**Indexes:**
- `(projectId)` — list lịch sử instances của 1 project
- `(nodeId, status)` — VPS worker query "container nào đang RUNNING trên node này"

---

### Bảng: `subscriptions`
Trạng thái subscription hiện tại — 1 user 1 row, upsert khi Stripe webhook.

| Column | Type | Mô tả |
|---|---|---|
| userId | FK UNIQUE | 1 user 1 subscription |
| planId | FK | Plan đang subscribe |
| status | Enum | `ACTIVE · PAST_DUE · CANCELLED · TRIALING · INCOMPLETE` |
| stripeSubscriptionId | String? UNIQUE | Stripe sub ID |
| currentPeriodStart/End | DateTime | Chu kỳ thanh toán |
| cancelAtPeriodEnd | Boolean | User cancel nhưng còn hiệu lực đến cuối kỳ |
| cancelledAt | DateTime? | Thời điểm cancel thật |

---

### Bảng: `invoices`
Lịch sử thanh toán — append-only, không sửa.

| Column | Type | Mô tả |
|---|---|---|
| userId | FK | Owner |
| stripeInvoiceId | String? UNIQUE | Stripe invoice ID |
| amount | Int | Số tiền (USD cents) — tránh float |
| currency | String | `"usd"` |
| status | Enum | `PENDING · PAID · FAILED · REFUNDED · VOID` |
| invoiceUrl / pdfUrl | String? | Link Stripe hosted invoice |
| periodStart/End | DateTime? | Kỳ tính phí |
| paidAt | DateTime? | Thời điểm thanh toán thành công |

---

### Bảng: `user_credits`
Credit balance của user — 1 user 1 row, upsert khi billing event.

| Column | Type | Mô tả |
|---|---|---|
| userId | FK UNIQUE | 1 user 1 row |
| monthlyBalance | Int | Credits từ subscription tháng này — reset ngày billing anniversary |
| purchasedBalance | Int | Credits mua thêm — không reset |
| monthlyResetAt | DateTime | Ngày reset tiếp theo (= currentPeriodEnd của subscription) |
| totalGranted | Int | Tổng credits đã nhận (audit) |
| totalUsed | Int | Tổng credits đã tiêu (audit) |

**Logic dùng credit:**
- Ưu tiên dùng `monthlyBalance` trước, rồi mới `purchasedBalance`
- `monthlyBalance` không carry over khi reset — unused credits mất
- `purchasedBalance` không hết hạn

---

### Bảng: `credit_transactions`
Audit trail mọi biến động credit — append-only.

| Column | Type | Mô tả |
|---|---|---|
| userId | FK | Owner |
| type | Enum | `MONTHLY_GRANT · PURCHASE · USAGE · REFUND · EXPIRY` |
| amount | Int | Dương = nhận, Âm = tiêu |
| balanceAfter | Int | Tổng balance sau transaction (monthlyBalance + purchasedBalance) |
| description | String | Mô tả: "FFmpeg job", "Starter pack", "Monthly Pro grant" |
| heavyJobId | FK? | Liên kết job nếu type = USAGE hoặc REFUND |
| creditPackId | FK? | Liên kết pack nếu type = PURCHASE |
| stripePaymentIntentId | String? | Stripe reference cho type = PURCHASE |
| createdAt | DateTime | |

**Indexes:**
- `(userId, createdAt DESC)` — history page
- `(heavyJobId)` — lookup transaction của 1 job

---

### Bảng: `credit_packs`
Các gói credit có thể mua — seed data.

| Column | Type | Mô tả |
|---|---|---|
| name | String | `"starter"`, `"standard"`, `"pro_pack"` |
| credits | Int | Số credits nhận được |
| priceUsd | Int | Giá (USD cents) |
| stripeProductId / stripePriceId | String? | Mapping Stripe one-time payment |
| active | Boolean | Ẩn/hiện pack trong UI |

**Seed data:**

| Pack | Credits | Price | Per credit |
|---|---|---|---|
| starter | 120 | $10 | $0.083 |
| standard | 320 | $25 | $0.078 |
| pro_pack | 700 | $50 | $0.071 |

---

### Bảng: `heavy_jobs`
Async heavy tasks (FFmpeg, Playwright, TTS, STT) — enqueue ở Control Plane, process ở VPS Heavy.

| Column | Type | Mô tả |
|---|---|---|
| userId / projectId | FK | Owner — `userId` để cross-project credit check |
| tool | Enum | `FFMPEG_SHORT · FFMPEG_LONG · PLAYWRIGHT · TTS · STT` |
| params | JSON | Input params cho tool |
| creditCost | Int | Snapshot credit cost tại thời điểm submit — không thay đổi sau đó |
| status | Enum | `PENDING · PROCESSING · DONE · FAILED · CANCELLED` |
| resultPath | String? | Đường dẫn kết quả trên storage |
| resultSizeMb | Int? | Để check quota storage |
| errorMessage | String? | Lý do thất bại |
| submittedAt / completedAt | DateTime | Đo thời gian xử lý |
| expiresAt | DateTime? | Auto-delete sau 30 ngày |

**Index:** `(userId, status)` — list jobs của user theo trạng thái

**Credit cost per tool:**

| Tool | Credits | ≈ USD | Ghi chú |
|---|---|---|---|
| `PLAYWRIGHT` (screenshot/PDF) | 1 | $0.10 | Nhanh, light |
| `TTS` (≤500 chars) | 1 | $0.10 | API call đơn giản |
| `STT` (≤1 phút audio) | 2 | $0.20 | Xử lý lâu hơn |
| `FFMPEG_SHORT` (≤2 phút video) | 3 | $0.30 | CPU intensive |
| `FFMPEG_LONG` (≤10 phút video) | 8 | $0.80 | Long encode |

**Quota check và deduct khi submit heavy job:**
```typescript
// 1. Resolve credit cost theo tool
const cost = CREDIT_COST_MAP[params.tool]; // e.g. 3

// 2. Check balance
const wallet = await prisma.userCredits.findUnique({ where: { userId } });
const totalBalance = wallet.monthlyBalance + wallet.purchasedBalance;
if (totalBalance < cost) {
  throw new PaymentRequiredException('Insufficient credits');
}

// 3. Deduct — monthly first, then purchased
const deductMonthly = Math.min(wallet.monthlyBalance, cost);
const deductPurchased = cost - deductMonthly;

// 4. Atomic transaction: update wallet + create heavy_job + log transaction
await prisma.$transaction([
  prisma.userCredits.update({
    where: { userId },
    data: {
      monthlyBalance: { decrement: deductMonthly },
      purchasedBalance: { decrement: deductPurchased },
      totalUsed: { increment: cost },
    },
  }),
  prisma.heavyJob.create({ data: { userId, projectId, tool, params, creditCost: cost, status: 'PENDING' } }),
  prisma.creditTransaction.create({
    data: { userId, type: 'USAGE', amount: -cost, description: `${tool} job`, heavyJobId: job.id },
  }),
]);
```

**Refund khi job FAILED:**
```typescript
// Hoàn credit nếu lỗi phía server (không hoàn nếu params sai)
if (job.status === 'FAILED' && isServerError(job.errorMessage)) {
  await refundCredits(userId, job.creditCost, job.id);
}
```

---

## 3. Điều phối Container (Orchestration Flow)

### 3.1 Spawn Container (user tạo project lần đầu)

```
Frontend → POST /api/projects
  → Resolve user plan: user → subscription → plan
  → Validate: count(user.projects) < plan.maxProjects
  → Validate: count(user.projects WHERE status=RUNNING) < plan.maxConcurrentRunning
  → Control Plane tạo Project record (status=CREATING, KHÔNG lưu planId)
  → Tạo ContainerInstance record: snapshot cpuLimit/ramLimit từ plan hiện tại
  → Enqueue job "spawn" {projectId, cpuLimit, ramLimit, idleTimeoutMin}
  → Trả về {projectId, status:"creating"}

VPS Worker consume job "spawn"
  → docker run --name openclaw-{subdomain} \
       --cpus={cpuLimit} --memory={ramLimit}m \
       --label traefik... \
       --env OPENCLAW_IDLE_TIMEOUT_MIN={idleTimeoutMin} ...
  → Cập nhật ContainerInstance.containerId + status=RUNNING
  → POST /api/internal/status {projectId, status:"running", containerId}
  → Control Plane update Project.status=RUNNING + ContainerInstance.startedAt
```

**Lưu ý:** `cpuLimit`, `ramLimit`, `idleTimeoutMin` được snapshot vào payload job
và vào `ContainerInstance` để tránh inconsistency khi user đổi plan giữa chừng.

### 3.2 Idle Detection & Auto-Stop

```
Scheduler chạy mỗi 1 phút
  → Query: projects WHERE status=RUNNING AND lastActiveAt < NOW()-10min
  → Với mỗi project stale:
      → Update Project.status=STOPPING (optimistic)
      → Enqueue job "stop" vào queue (priority thấp)

VPS Worker consume job "stop"
  → docker stop openclaw-{userId}
  → POST /api/internal/status {status:"stopped", exitCode:0}
  → Control Plane update ContainerInstance.stoppedAt + status=STOPPED

Container heartbeat (mỗi 5 phút khi có activity)
  → POST /api/internal/heartbeat {projectId}
  → Control Plane update Project.lastActiveAt = NOW()
  → Idle timer reset
```

### 3.3 Wake Container (user quay lại)

```
Frontend → POST /api/projects/:id/start
  → Check Project.status = STOPPED
  → Update Project.status = STARTING
  → Tạo ContainerInstance mới (status=STARTING)
  → Enqueue job "wake" (priority=1 — cao nhất)
  → Trả ngay {status:"starting", estimatedWait:"3-5s"}

VPS Worker consume job "wake" (ưu tiên cao)
  → docker start openclaw-{userId}  (hoặc docker run nếu container đã bị xóa)
  → Update ContainerInstance.startedAt + status=RUNNING
  → POST /api/internal/status {status:"running"}
```

### 3.4 Queue Priority

| Job | Priority | Retry | Lý do |
|---|---|---|---|
| wake | 1 (cao nhất) | 2 lần | User đang chờ |
| spawn | 5 | 3 lần exponential | Tạo mới, chấp nhận chờ |
| stop | 10 (thấp nhất) | 1 lần | Background, không gấp |
| destroy | 5 | KHÔNG retry | Tránh xóa nhầm 2 lần |

---

## 4. API Endpoints

### Auth
```
POST  /api/auth/register          email + password + name
POST  /api/auth/login             email + password
POST  /api/auth/logout
GET   /api/auth/session
GET   /api/auth/sign-in/google    → redirect 302 Google
GET   /api/auth/callback/google   ← Google callback
```

### Projects (SessionGuard required)
```
GET    /api/projects/mine
POST   /api/projects
POST   /api/projects/:id/start
POST   /api/projects/:id/stop
GET    /api/projects/:id/health    → {status, domain, lastActiveAt}
DELETE /api/projects/:id
GET    /api/projects/:id/instances → lịch sử ContainerInstance
```

### Heavy Tasks (SessionGuard required)
```
POST   /api/heavy/submit           {tool, params, projectId}
  → Resolve credit cost theo tool
  → Check wallet.monthlyBalance + wallet.purchasedBalance >= cost
  → Atomic: deduct credits + create job + log transaction
GET    /api/heavy/status/:jobId    → {status, creditCost, resultPath?}
POST   /api/heavy/cancel/:jobId    → refund nếu PENDING
GET    /api/heavy/results/:jobId
DELETE /api/heavy/results/:jobId
GET    /api/heavy/history          ?projectId= (optional filter)
```

### Credits (SessionGuard required)
```
GET    /api/credits/wallet         → {monthlyBalance, purchasedBalance, monthlyResetAt}
GET    /api/credits/history        → credit_transactions (paged)
GET    /api/credits/packs          → list active credit_packs
POST   /api/credits/purchase       {packId} → Stripe Payment Intent
POST   /api/credits/webhook        ← Stripe webhook (payment succeeded → grant credits)
GET    /api/credits/cost/:tool     → {tool, credits, usdEquivalent}
```

### Internal (VPS_WORKER_SECRET header required)
```
POST   /api/internal/status        {projectId, status, containerId, exitCode}
POST   /api/internal/heartbeat     {projectId}
POST   /api/internal/wake/:userId
PUT    /api/internal/job/:jobId/result
```

---

## 5. Redis Queue Design

### Queue: `container-ops`
Control Plane enqueue → VPS Worker consume.

| Job name | Payload | Timeout |
|---|---|---|
| spawn | projectId, userId, subdomain, imageVersion, cpuLimit, ramLimit | 2 phút |
| wake | projectId, userId | 30 giây |
| stop | projectId, userId | 1 phút |
| destroy | projectId, userId | 2 phút |

### Queue: `heavy-tasks`
Control Plane enqueue → VPS Heavy consume.

| Job name | Payload | Timeout |
|---|---|---|
| ffmpeg | userId, projectId, params | 5 phút |
| playwright | userId, projectId, params | 2 phút |
| tts | userId, projectId, params | 2 phút |
| stt | userId, projectId, params | 5 phút |

### Scale path
- **MVP:** Railway managed Redis — 1 Redis cho cả 2 queue
- **>5k users:** Tách 2 Redis instance — container-ops và heavy-tasks không cạnh tranh nhau

---

## 6. Security

| Layer | Cơ chế |
|---|---|
| User API | SessionGuard — verify cookie token trong DB |
| Internal API | `Authorization: Bearer {VPS_WORKER_SECRET}` header |
| Password | scrypt + random salt 16 bytes + timingSafeEqual |
| Cookie | httpOnly + secure (production) + sameSite=lax |
| Project ownership | Service layer verify `userId` match trước mọi action |
| Rate limit register | Max 5 attempts/IP/giờ — chống spam account |
| Subdomain | nanoid(8) lowercase alphanumeric, unique check trước insert |

---

## 7. Environment Variables

| Variable | Bắt buộc | Mô tả |
|---|---|---|
| DATABASE_URL | ✅ | Neon PostgreSQL connection string |
| REDIS_URL | ✅ | Redis connection (Railway hoặc dedicated) |
| BETTER_AUTH_SECRET | ✅ | Random 32 bytes — sign session |
| GOOGLE_CLIENT_ID | ✅ | Google OAuth app |
| GOOGLE_CLIENT_SECRET | ✅ | Google OAuth app |
| FRONTEND_URL | ✅ | CORS + redirect sau Google callback |
| VPS_WORKER_SECRET | ✅ | Shared secret VPS Worker ↔ Control Plane |
| API_URL | ✅ | Public URL của backend — build Google callback URI |
| PORT | ⬜ | Default 3001 |
| NODE_ENV | ⬜ | `production` để bật secure cookie |

---

## 8. Migrations

Dùng **Prisma Migrate** — schema-first, migration files commit vào git.

- `npx prisma migrate dev --name <tên>` — local dev, tạo + apply
- `npx prisma migrate deploy` — production (Railway `start:prod` script)
- `npx prisma migrate reset` — reset local DB (xóa data)
- `npx prisma db seed` — seed plans data

---

## 9. Không làm cho MVP

| Feature | Khi nào làm |
|---|---|
| Stripe billing | Khi có paid tier |
| Multi-VPS node selector | Khi thêm VPS thứ 2 |
| Email notifications | Sprint 2 |
| Admin dashboard | Khi cần support users |
| SSE job streaming | Khi polling gây UX lag |
| Container log streaming | Sprint 3 |
| Resource usage metrics | Khi cần billing by usage |
