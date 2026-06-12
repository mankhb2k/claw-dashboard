# Nguyên tắc Bảo mật — AucoBot Cloud API

> Áp dụng cho `aucobot/cloud/api/` và các package `@aucobot-cloud/*` wired từ cloud-api.  
> **Kế thừa bắt buộc:** [`apps/api/.agent/rule.md`](../../../apps/api/.agent/rule.md) — JWT, `assertOwned`, secrets crypto, sync DB↔volume, response envelope.  
> File này chỉ bổ sung **threat model hosted multi-tenant** và ranh giới **OSS public vs Cloud proprietary**.

---

## Tổng quan

| # | Nhóm | Mục tiêu Cloud |
|---|------|----------------|
| 1 | **Threat model** | Coi OSS đã lộ — không security through obscurity |
| 2 | **Multi-tenant isolation** | User/project A không chạm data/runtime user B |
| 3 | **Fleet & runtime** | Docker spawn an toàn, container cách ly |
| 4 | **Network & ingress** | Không expose gateway thẳng ra internet |
| 5 | **Billing & quota** | Stripe webhook, plan guard, chống abuse credit |
| 6 | **Object storage (S3)** | Avatar, attachment — key scoped, không public bucket |
| 7 | **Secrets & vận hành** | Env prod, audit, rate limit, incident |

---

## 0. Quan hệ OSS ↔ Cloud

```text
apps/api (OSS, public)     →  JWT, assertOwned, workspace sync, chat WS proxy
cloud/api (private)        →  composition root: override provisioner + plan guard
cloud/packages/*           →  fleet, billing, quota, ingress, S3 storage
packages/* (shared)        →  database, control-plane-core, workspace-sync
```

| Thành phần | OSS | Cloud |
|------------|-----|-------|
| Schema DB | `@aucobot/database` | **Cùng schema** + bảng extension (`subscriptions`, `project_runtimes`, …) |
| `RUNTIME_MODE` | `oss` | `cloud` |
| Gateway | Một container chung `:18789` | **1 container / project**, `host_port` động |
| Docker socket | **Cấm** | Chỉ orchestrator/fleet — **không** mount vào `cloud-web` |
| Plan guard | `NoopPlanGuard` | `StripePlanGuard` / quota (`billing-plan.md`) |

**Nguyên tắc:** Bug authorization hoặc leak secret trong OSS **ảnh hưởng Cloud** vì dùng chung core. Fix OSS + test multi-tenant trước khi ship Cloud.

---

## 1. Threat model — “Attacker đã đọc repo OSS”

> Cloud **không** được thiết kế như thể API là bí mật. Attacker biết route, DTO, `assertOwned`, whitelist RPC, thuật toán AES.

### 1.1 Attacker có thể làm (giả định)

- Liệt kê endpoint qua Swagger, source `apps/api`, hoặc crawl
- Thử **IDOR**: đổi `projectId`, `attachmentId`, `userId` trong URL
- Thử **privilege escalation**: Free → Pro feature, vượt quota, spawn thêm container
- Brute-force / credential stuffing `POST /api/auth/login`
- Abuse endpoint nhạy cảm: `reveal`, `gateway-token`, upload, spawn/start
- Kết nối WS chat proxy không JWT hoặc JWT user khác
- Gửi webhook giả nếu Stripe endpoint không verify signature

### 1.2 Attacker **không** thể chỉ vì biết code

- Giải mã `ciphertext` trong DB **không có** `JWT_SECRET` / `PROVIDER_KEY_ENCRYPTION_SECRET` trên server prod
- Forge JWT hợp lệ
- Đọc object S3 của tenant khác **nếu** API luôn `assertOwned` + validate `storageKey` prefix
- Spawn container trên fleet **nếu** Docker API chỉ reachable từ orchestrator nội bộ

### 1.3 Security không dựa vào

| ❌ Không đủ | ✅ Phải có |
|------------|-----------|
| Repo `cloud/` private | Enforcement server-side mỗi request |
| Ẩn URL API | `JwtAuthGuard` + `assertOwned` + plan guard |
| Schema DB “khác OSS” | Cùng schema OK — isolation bằng **logic + network** |
| Obfuscate endpoint | Rate limit, monitoring, pentest |

---

## 2. Multi-tenant isolation

> Cloud: **nhiều user / nhiều project** trên **một** Postgres + **một** fleet. Đây là rủi ro lớn nhất so với OSS self-host.

### 2.1 User boundary

- Mọi query Prisma trên resource user: filter `userId` từ JWT — **không** từ body/query client.
- `subscriptions`, `credit_wallets`, `billing_customers`: FK `user_id` → chỉ service billing đọc sau khi xác `user.sub`.
- **Cấm** endpoint admin/debug trả list user/project toàn platform trừ khi có **role admin** riêng + audit.

### 2.2 Project boundary

- **Bắt buộc** `ProjectsService.assertOwned(user.sub, projectId)` trên mọi route `/projects/:id/*` (kế thừa OSS rule §1.2).
- Trả **`404 Project not found`** — không `403` — khi project thuộc user khác (chống enumeration).
- OSS constraint `userId @unique` (1 user ≈ 1 project) **phải bỏ** trên Cloud — thay bằng `@@index([userId])` + enforce `maxProjects` trong plan guard.

### 2.3 Resource con (attachment, agent, channel, key)

- Query luôn gồm `{ projectId, userId }` hoặc join project với `userId`.
- Download attachment: verify row DB **và** `storageKey` khớp `chatAttachmentObjectKey(projectId, …)` — **cấm** client gửi arbitrary S3 key.

### 2.4 Cross-tenant test bắt buộc

Trước ship feature Cloud mới:

```text
User A + Project PA  →  mọi thao tác với Project PB (user B) phải 404/403
User A JWT           →  không spawn/stop container của B
User A               →  không đọc S3 key của B (kể cả đoán UUID)
```

### 2.5 Subdomain / public URL

- `project.subdomain` unique globally — resolve public URL **chỉ** sau auth hoặc qua ingress có policy rõ.
- **Cấm** wildcard route ingress map nhầm container tenant A sang hostname tenant B.

---

## 3. Fleet & runtime (Docker per project)

> `cloud/packages/fleet` — `DockerPerProjectProvisioner`. Đây là **quyền root-equivalent** trên hạ tầng.

### 3.1 Ranh giới tin cậy

```text
cloud-web (untrusted browser)  →  cloud-api  →  fleet/orchestrator  →  Docker API
                                      ↑
                              JWT + plan guard + assertOwned
```

- **Cấm** expose Docker socket / K8s API ra client hoặc `cloud-web`.
- Spawn/start/stop/respawn: **chỉ** sau `assertOwned` + `PlanGuard.canSpawn()` (quota `maxProjects`, `maxConcurrentRunning`).
- Metadata fleet (`container_id`, `host_port`) trong `project_runtimes` — **không** tin giá trị từ client.

### 3.2 Container isolation

| Yêu cầu | Ghi chú |
|---------|---------|
| Volume **per project** | Không mount chung `openclaw_data` giữa tenant |
| CPU/RAM limit | Theo plan (`billing-plan.md`) — enforce lúc create container |
| Non-root user trong image | Pin image OpenClaw — không `privileged: true` trừ khi bắt buộc có review |
| Không mount docker.sock vào worker | Worker chỉ đọc volume project |
| Gateway token **per project** | Khác OSS global token — random per project, sync `openclaw.json` |

### 3.3 Spawn abuse

- Rate limit: create project, respawn, start — per user/IP.
- Idle shutdown + `maxConcurrentRunning` — tránh user Free chiếm fleet vô hạn.
- Log mọi lifecycle event: `userId`, `projectId`, `container_id`, action, kết quả.

### 3.4 OSS actions trên Cloud

- `POST /projects/:id/start|stop|respawn` **có** trên Cloud — vẫn `assertOwned` + quota.
- OSS message “restart compose” **không** áp dụng — document riêng cho cloud support.

---

## 4. Network & ingress

> `cloud/packages/ingress` — Traefik, TLS, route tới `host_port` động.

### 4.1 Chat / gateway path

```text
Browser  →  cloud-api (JWT)  →  WS proxy  →  127.0.0.1:host_port (container nội bộ)
```

- **Cấm** publish `host_port` ra `0.0.0.0` public không qua API proxy (user gọi thẳng gateway bỏ qua auth).
- Production: chat **luôn** qua `/api/projects/:id/chat/ws` — giống OSS `workflow.md` §5.7.
- Ingress worker callback (nếu có): shared secret / mTLS — không anonymous POST.

### 4.2 TLS & CORS

- HTTPS bắt buộc; HSTS trên domain Cloud.
- CORS `credentials: true` — origin **chỉ** domain `cloud-web` prod — không `*`.
- **Tắt Swagger** (`/api/docs`) trên production hoặc bảo vệ basic auth / IP allowlist nội bộ.

### 4.3 SSRF từ control plane

- Fleet/API gọi URL nội bộ (`OPENCLAW_GATEWAY_URL`, worker callback): validate scheme/host — **cấm** user-controlled URL drive spawn/connect tới metadata cloud / Docker API.

---

## 5. Billing, quota & abuse

> `cloud/packages/billing`, `cloud/packages/quota` — `docs/billing-plan.md`.

### 5.1 Plan guard

- Mọi hành động tốn tài nguyên: check plan **trước** side effect (spawn, cron create, heavy job, keep-alive).
- Plan gắn **User** (`subscriptions`), không `plan_id` trên `projects`.
- Upgrade/downgrade: atomic update subscription + invalidate cache plan — không race grant Pro quota.

### 5.2 Credit wallet

- Trừ credit **trong transaction** DB (`monthlyBalance` → `purchasedBalance`) — chống double-spend concurrent.
- Heavy job: reserve → execute → commit/refund — không trừ sau khi job đã chạy không kiểm soát.
- **Cấm** client gửi `creditsToDeduct` — server tính từ tool + plan.

### 5.3 Stripe webhooks

- Verify **Stripe signature** (`stripe-signature` header) — **cấm** xử lý body không verify.
- Webhook endpoint: không JWT — chỉ Stripe IP/signature + idempotency key (`event.id`).
- Map `stripe_customer_id` → `billing_customers.user_id` — không tin email từ payload alone.
- Log webhook; **không** log full card/PII.

### 5.4 Enumeration & fraud

- Rate limit login, register, refresh, password reset.
- Alert: nhiều project spawn fail, credit drain bất thường, webhook replay.

---

## 6. Object storage (S3)

> `cloud/packages/avatar-storage`, `cloud/packages/chat-attachment-storage`.

### 6.1 Bucket policy

- Bucket **private** — không public-read ACL.
- Avatar serve qua API (`USER_AVATAR_API_PATH`) hoặc signed URL ngắn hạn — **không** permanent public URL chứa PII nếu không cần.

### 6.2 Key naming (bắt buộc dùng helper)

| Loại | Pattern | Validate khi read |
|------|---------|-------------------|
| Avatar | `users/{userId}/avatar` | `userId === jwt.sub` hoặc admin |
| Chat attachment | `chatAttachmentObjectKey(projectId, …)` | `assertOwned` + row DB `storageKey` |

- **Cấm** `GetObject` với key do client truyền thẳng.
- `CacheControl: private` — không CDN cache chung giữa user.

### 6.3 Credentials S3

- IAM/user S3 **least privilege**: chỉ bucket cloud prod, prefix cần thiết.
- **Cấm** embed `AVATAR_S3_SECRET_*` trong `cloud-web` hoặc response API.

---

## 7. Secrets & môi trường production

### 7.1 Secret bắt buộc riêng Cloud (không dùng `.env.example`)

| Secret | Mục đích |
|--------|----------|
| `JWT_SECRET` | Session — **≥ 32 byte random**, rotate có kế hoạch |
| `PROVIDER_KEY_ENCRYPTION_SECRET` | Encrypt API keys at-rest — **khác** OSS demo |
| `DATABASE_URL` | Postgres — không public internet |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Billing |
| `AVATAR_S3_*`, `CHAT_ATTACHMENT_S3_*` | Object storage |
| Docker/K8s credentials | Chỉ orchestrator |

- **Cấm** dùng cùng `JWT_SECRET` giữa staging và prod.
- Secret manager (AWS SM, Vault, Doppler) — không plaintext trong image Docker.

### 7.2 DB Postgres Cloud

- Instance **riêng** do operator quản lý — **không** chung DB với bất kỳ OSS self-host nào.
- Encryption at-rest + backup encrypted; least-privilege DB user cho API.
- **Cấm** expose `5432` ra internet.

### 7.3 Logging & PII

- Structured log (Pino) — redact: password, token, `apiKey`, `gatewayToken`, Stripe object full.
- Audit log riêng (khuyến nghị): `reveal` provider key, spawn, plan change, exec-policy change.

---

## 8. Kế thừa từ OSS rule (không được relax trên Cloud)

Các mục sau **giữ nguyên** từ `apps/api/.agent/rule.md` — Cloud **không** nới lỏng:

- JWT ≠ gateway token; WS proxy auth trước bridge
- `encryptSecret` / `maskSecret` / controlled `reveal`
- Global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`)
- `CHAT_RPC_WHITELIST` — không forward RPC tùy ý
- Exec/sandbox policy sync xuống volume
- Response envelope + không leak stack trace
- Sync DB → volume khi user Save — OpenClaw không đọc Postgres

---

## 9. Phạm vi task Cloud

### 9.1 Trong phạm vi

```text
aucobot/cloud/api/
aucobot/cloud/packages/{fleet,billing,quota,ingress,avatar-storage,chat-attachment-storage}/
aucobot/packages/database/          # nếu thêm bảng extension Cloud
aucobot/apps/api/                   # chỉ khi fix bug core ảnh hưởng Cloud — ghi rõ trong task
```

### 9.2 Cấm (trừ khi user yêu cầu)

| Cấm | Lý do |
|-----|--------|
| Import `@aucobot-cloud/*` vào `apps/web` OSS public | Lộ contract proprietary |
| Mount `docker.sock` vào OSS `apps/api` | Ranh OSS |
| Bypass `assertOwned` vì “internal Cloud” | IDOR multi-tenant |
| Public bucket / public gateway port | Data leak |
| Commit secret / `.env` prod | Credential leak |

### 9.3 Verify

```bash
cd aucobot
pnpm --filter @aucobot-cloud/fleet build          # nếu chạm fleet
pnpm --filter @aucobot-cloud/billing build      # nếu chạm billing
pnpm --filter @aucobot/api build                  # core OSS phải vẫn build
# cloud-api khi có package:
pnpm --filter @aucobot/cloud-api build
```

### 9.4 Template task (AI)

```text
Task: [một câu]
Scope: aucobot/cloud/api/ hoặc cloud/packages/<name>/
Out of scope: apps/web OSS, unrelated OSS refactor
Security: cloud-rule.md §[multi-tenant|fleet|billing|s3]
OSS baseline: apps/api/.agent/rule.md §[n]
Verify: pnpm --filter … build
Cross-tenant test: User A không access Project B
```

---

## 10. Checklist endpoint / feature Cloud mới

- [ ] Kế thừa OSS: `JwtAuthGuard`, DTO, envelope response
- [ ] `assertOwned` nếu project-scoped
- [ ] `PlanGuard` / quota nếu tốn tài nguyên hoặc giới hạn plan
- [ ] Fleet: không tin `container_id` / `host_port` từ client
- [ ] S3: key từ helper, không user-supplied key
- [ ] Stripe webhook: verify signature + idempotent
- [ ] Không log secret / PII
- [ ] Cross-tenant test case
- [ ] Không expose Swagger/internal debug prod
- [ ] Rate limit trên endpoint abuse-prone

---

## 11. Đọc thêm (onboarding Cloud)

| Doc | Khi |
|-----|-----|
| [`apps/api/.agent/rule.md`](../../../apps/api/.agent/rule.md) | Baseline backend OSS |
| [`workflow.md`](../../../../workflow.md) (repo root) | OSS vs Cloud runtime, chat proxy |
| [`docs/monorepoplan.md`](../../docs/monorepoplan.md) §10 | DB extension, fleet diagram |
| [`docs/billing-plan.md`](../../docs/billing-plan.md) | Plan, credit, quota |
| [`cloud/README.md`](../../README.md) | Folder map Cloud |
