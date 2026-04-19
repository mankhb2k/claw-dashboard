# Function Registry — OpenClaw Backend

> Cập nhật mỗi khi thêm/sửa function. Mỗi file ghi: **nhiệm vụ file** + **từng function làm gì**.

---

## `src/main.ts`

**Nhiệm vụ:** Bootstrap NestJS app với Fastify adapter, đăng ký plugin và global middleware.

| Function      | Mô tả                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------- |
| `bootstrap()` | Khởi tạo app, đăng ký CORS + cookie plugin, gắn global interceptor/filter, lắng nghe port |

---

## `src/app.module.ts`

**Nhiệm vụ:** Root module — khai báo và kết nối tất cả các module con (PrismaModule, AuthModule). Không chứa logic, chỉ là điểm lắp ráp toàn bộ DI graph của app.

_(Không có function)_

---

## `src/app.controller.ts`

**Nhiệm vụ:** Controller gốc — cung cấp endpoint `GET /health` cho Railway health check và `GET /` placeholder. Không liên quan đến business logic.

| Endpoint      | Function     | Mô tả                                                                     |
| ------------- | ------------ | ------------------------------------------------------------------------- |
| `GET /`       | `getHello()` | Trả chuỗi "Hello World!" — placeholder, có thể xóa sau                    |
| `GET /health` | `health()`   | Trả `{status:"ok", uptime}` — Railway dùng để kiểm tra app còn sống không |

---

## `src/app.service.ts`

**Nhiệm vụ:** Service gốc đi kèm AppController. Hiện chỉ có hàm placeholder, chưa có logic thật. Có thể dùng sau cho các tác vụ toàn cục (vd: thống kê hệ thống).

| Function     | Mô tả                                                                     |
| ------------ | ------------------------------------------------------------------------- |
| `getHello()` | Trả chuỗi "Hello World!" — placeholder từ NestJS scaffold, chưa dùng thật |

---

## `src/prisma/prisma.service.ts`

**Nhiệm vụ:** Wrapper PrismaClient, inject vào NestJS DI, quản lý lifecycle kết nối DB.

| Function         | Mô tả                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| `constructor()`  | Khởi tạo `PrismaPg` adapter từ `DATABASE_URL`, truyền vào `super({adapter})` — Prisma v7 bắt buộc     |
| `onModuleInit()` | Gọi `$connect()` khi NestJS khởi động — thiết lập kết nối PostgreSQL                                  |

---

## `src/prisma/prisma.module.ts`

**Nhiệm vụ:** Global module export PrismaService — mọi module khác đều dùng được mà không cần import lại.

---

## `src/common/types/api-response.type.ts`

**Nhiệm vụ:** Định nghĩa kiểu dữ liệu response chuẩn dùng xuyên suốt toàn bộ API.

| Function              | Mô tả                                                                |
| --------------------- | -------------------------------------------------------------------- |
| `ok<T>(data)`         | Tạo response thành công `{success:true, data, error:null}`           |
| `fail(code, message)` | Tạo response lỗi `{success:false, data:null, error:{code, message}}` |

---

## `src/common/interceptors/response.interceptor.ts`

**Nhiệm vụ:** NestJS global interceptor — tự động bọc mọi response của controller vào format `ApiResponse`.

| Function               | Mô tả                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------- |
| `intercept(ctx, next)` | Pipe response qua `map()` — nếu chưa có format chuẩn thì bọc vào `{success:true, data}` |

---

## `src/common/filters/http-exception.filter.ts`

**Nhiệm vụ:** NestJS global exception filter — bắt mọi exception và trả về format `ApiResponse` thay vì Fastify default error.

| Function                 | Mô tả                                                                                           |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| `catch(exception, host)` | Bắt exception, xác định status code và message, trả về `{success:false, error:{code, message}}` |
| `statusToCode(status)`   | Map HTTP status number sang error code string (vd: 401 → `AUTH_UNAUTHENTICATED`)                |

---

## `src/auth/auth.utils.ts`

**Nhiệm vụ:** Các hàm tiện ích auth dùng Node.js built-in `crypto` — không phụ thuộc thư viện bên ngoài.

| Function                        | Mô tả                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| `hashPassword(plain)`           | Hash password dùng `crypto.scrypt` + random salt 16 bytes, trả về `salt:hash`      |
| `verifyPassword(plain, stored)` | So sánh password plain với hash đã lưu, dùng `timingSafeEqual` chống timing attack |
| `generateSessionToken()`        | Tạo session token ngẫu nhiên 32 bytes hex (64 ký tự)                               |
| `sessionExpiresAt(days)`        | Tính thời điểm hết hạn session, mặc định 30 ngày từ hiện tại                       |

---

## `src/auth/google.oauth.ts`

**Nhiệm vụ:** Thực hiện Google OAuth2 flow thủ công dùng `fetch` — không dùng passport hay thư viện OAuth.

| Function                                   | Mô tả                                                                                     |
| ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `buildGoogleAuthUrl(redirectUri, state)`   | Tạo URL redirect sang Google OAuth consent screen với đủ params (client_id, scope, state) |
| `exchangeCodeForTokens(code, redirectUri)` | POST tới Google token endpoint để đổi `code` lấy `access_token` + `refresh_token`         |
| `getGoogleUserInfo(accessToken)`           | GET Google userinfo endpoint để lấy thông tin user (email, name, picture, sub)            |

---

## `src/auth/auth.service.ts`

**Nhiệm vụ:** Business logic toàn bộ auth — register, login, session, Google OAuth. Tương tác trực tiếp với DB qua PrismaService.

| Function                            | Mô tả                                                                                  |
| ----------------------------------- | -------------------------------------------------------------------------------------- |
| `register(email, password, name)`   | Kiểm tra email tồn tại, hash password, tạo User + Account(email) trong DB, tạo session |
| `login(email, password)`            | Tìm user + account, verify password, tạo session mới                                   |
| `logout(token)`                     | Xóa session khỏi DB theo token                                                         |
| `getSession(token)`                 | Tìm session trong DB, kiểm tra chưa expired, trả về `{user, session}`                  |
| `getGoogleRedirectUrl(state)`       | Gọi `buildGoogleAuthUrl` với redirectUri được build từ `API_URL` env                   |
| `handleGoogleCallback(code)`        | Đổi code lấy token → lấy user info → tìm/tạo User + Account(google) → tạo session      |
| `createSession(userId)` _(private)_ | Tạo session record trong DB với token ngẫu nhiên, trả về `{user, token, expiresAt}`    |
| `googleRedirectUri()` _(private)_   | Build callback URL: `{API_URL}/api/auth/callback/google`                               |
| `cookieName()` _(static)_           | Trả về tên cookie `"session_token"` — dùng chung giữa service và controller            |

---

## `src/auth/auth.controller.ts`

**Nhiệm vụ:** HTTP handler cho tất cả auth endpoints — nhận request, gọi AuthService, set/clear cookie, trả về ApiResponse.

| Endpoint                        | Function             | Mô tả                                                                                   |
| ------------------------------- | -------------------- | --------------------------------------------------------------------------------------- |
| `POST /api/auth/register`       | `register()`         | Validate body, gọi service.register, set session cookie, trả user                       |
| `POST /api/auth/login`          | `login()`            | Validate body, gọi service.login, set session cookie, trả user                          |
| `POST /api/auth/logout`         | `logout()`           | Đọc cookie, gọi service.logout, clear cookie                                            |
| `GET /api/auth/session`         | `session()`          | Đọc cookie, gọi service.getSession, trả user hoặc fail                                  |
| `GET /api/auth/sign-in/google`  | `signInGoogle()`     | Redirect 302 sang Google OAuth URL                                                      |
| `GET /api/auth/callback/google` | `googleCallback()`   | Nhận code từ Google, gọi service.handleGoogleCallback, set cookie, redirect về frontend |
| _(private)_                     | `setSessionCookie()` | Set httpOnly cookie với token + expiresAt, secure=true khi production                   |
| _(private)_                     | `sanitizeUser()`     | Lọc bỏ các field nhạy cảm, chỉ trả id/name/email/image/emailVerified/createdAt          |

---

## `src/auth/guards/session.guard.ts`

**Nhiệm vụ:** NestJS Guard — bảo vệ các route cần đăng nhập. Đọc cookie, verify session, gắn `req.user`.

| Function           | Mô tả                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `canActivate(ctx)` | Đọc `session_token` cookie, gọi authService.getSession, nếu hợp lệ thì gắn user vào `req.user` và cho qua |

---

## `src/auth/auth.module.ts`

**Nhiệm vụ:** NestJS module khai báo và export AuthService + SessionGuard để các module khác (Projects, Heavy) dùng lại.

---

## `src/common/decorators/current-user.decorator.ts`

**Nhiệm vụ:** NestJS param decorator — trích xuất `req.user` (đã được SessionGuard gắn) thành tham số controller, tránh lặp code `req.user` ở mọi handler.

| Function | Mô tả |
|---|---|
| `CurrentUser` | Decorator factory — đọc `req.user` từ ExecutionContext, trả về `RequestUser` |

---

## `src/projects/projects.service.ts`

**Nhiệm vụ:** Business logic toàn bộ Projects — tạo, quản lý vòng đời, kiểm tra plan limit, tương tác DB qua PrismaService.

| Function | Mô tả |
|---|---|
| `findByUser(userId)` | Lấy tất cả projects của user, kèm plan info, sort mới nhất trước |
| `create(userId)` | Kiểm tra plan limit → generate subdomain → tạo project với status CREATING |
| `getHealth(projectId, userId)` | Trả status, subdomain, lastActiveAt, storageUsedMb của project |
| `start(projectId, userId)` | Validate status → update STARTING → tạo ContainerInstance mới → (TODO: enqueue BullMQ wake) |
| `stop(projectId, userId)` | Validate status → update STOPPED → update ContainerInstance active → (TODO: enqueue BullMQ stop) |
| `remove(projectId, userId)` | Chặn xóa khi đang RUNNING → xóa project + cascade instances → (TODO: enqueue BullMQ destroy) |
| `getInstances(projectId, userId)` | Lấy 20 ContainerInstance gần nhất của project, sort mới nhất trước |
| `findOwned(projectId, userId)` _(private)_ | Tìm project theo id, throw 404 nếu không tồn tại, throw 403 nếu không phải owner |
| `getFreePlan()` _(private)_ | Lấy plan `"free"` từ DB — throw nếu chưa seed |
| `generateUniqueSubdomain()` _(private)_ | Tạo nanoid(8) lowercase, retry tối đa 5 lần nếu trùng |

---

## `src/projects/projects.controller.ts`

**Nhiệm vụ:** HTTP handler cho Projects endpoints — tất cả routes đều qua `@UseGuards(SessionGuard)`.

| Endpoint | Function | Mô tả |
|---|---|---|
| `GET /api/projects/mine` | `mine()` | Lấy danh sách projects của user đang login |
| `POST /api/projects` | `create()` | Tạo project mới (free plan: tối đa 1) |
| `POST /api/projects/:id/start` | `start()` | Wake container |
| `POST /api/projects/:id/stop` | `stop()` | Stop container |
| `GET /api/projects/:id/health` | `health()` | Lấy trạng thái + domain |
| `GET /api/projects/:id/instances` | `instances()` | Lịch sử ContainerInstance |
| `DELETE /api/projects/:id` | `remove()` | Xóa project (phải stop trước) |

---

## `src/projects/projects.module.ts`

**Nhiệm vụ:** NestJS module kết nối ProjectsController + ProjectsService, import AuthModule để dùng SessionGuard.

---

## Bảng tổng hợp theo chức năng

| Chức năng             | Files liên quan                                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Bootstrap & wiring    | `main.ts`, `app.module.ts`                                                                                                    |
| Health check          | `app.controller.ts`, `app.service.ts`                                                                                         |
| Response format chuẩn | `common/types/api-response.type.ts`, `common/interceptors/response.interceptor.ts`, `common/filters/http-exception.filter.ts` |
| Auth email/password   | `auth/auth.utils.ts`, `auth/auth.service.ts`, `auth/auth.controller.ts`                                                       |
| Auth Google OAuth     | `auth/google.oauth.ts`, `auth/auth.service.ts`, `auth/auth.controller.ts`                                                     |
| Session management    | `auth/auth.service.ts` (getSession, createSession, logout), `auth/guards/session.guard.ts`                                    |
| Projects CRUD         | `projects/projects.service.ts`, `projects/projects.controller.ts`                                                             |
| Container lifecycle   | `projects/projects.service.ts` (start, stop, remove, getInstances)                                                           |
| Current user inject   | `common/decorators/current-user.decorator.ts`                                                                                 |
| Database              | `prisma/prisma.service.ts`, `prisma/prisma.module.ts`                                                                         |
| Tests (scaffold)      | `app.controller.spec.ts`                                                                                                      |

---

## Error codes chuẩn

| Code                       | HTTP Status | Khi nào                               |
| -------------------------- | ----------- | ------------------------------------- |
| `AUTH_UNAUTHENTICATED`     | 401         | Không có session hoặc session hết hạn |
| `AUTH_FORBIDDEN`           | 403         | Có session nhưng không đủ quyền       |
| `AUTH_INVALID_CREDENTIALS` | 401         | Sai email hoặc password               |
| `AUTH_EMAIL_EXISTS`        | 409         | Email đã đăng ký                      |
| `BAD_REQUEST`              | 400         | Thiếu hoặc sai format input           |
| `NOT_FOUND`                | 404         | Resource không tồn tại                |
| `INTERNAL_ERROR`           | 500         | Lỗi server không xác định             |
