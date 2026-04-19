# Endpoint Registry — OpenClaw API

> Base URL (local): `http://localhost:3001`  
> Swagger UI: `http://localhost:3001/api/docs`  
> Auth: session cookie `session_token` (httpOnly). Swagger UI sẽ tự gửi cookie nếu dùng browser.

---

## Group: Auth `/api/auth`

### POST /api/auth/register
- **Mục đích:** Tạo tài khoản mới bằng email + password
- **Auth required:** Không
- **Body (JSON):**
  ```json
  { "email": "user@example.com", "password": "secret123", "name": "Alice" }
  ```
- **Response 201:** Session cookie set + `{ user: { id, name, email, image, emailVerified, createdAt } }`
- **Response 409:** Email đã tồn tại
- **Test notes:** Dùng email chưa đăng ký. Sau khi gọi, browser/Postman sẽ nhận cookie `session_token`.

---

### POST /api/auth/login
- **Mục đích:** Đăng nhập bằng email + password
- **Auth required:** Không
- **Body (JSON):**
  ```json
  { "email": "user@example.com", "password": "secret123" }
  ```
- **Response 200:** Session cookie set + `{ user: {...} }`
- **Response 401:** Sai email hoặc password
- **Test notes:** Phải register trước. Cookie cũ sẽ bị ghi đè.

---

### POST /api/auth/logout
- **Mục đích:** Đăng xuất — xóa session khỏi DB và clear cookie
- **Auth required:** Cookie `session_token` (optional — nếu không có vẫn trả 200)
- **Body:** Không cần
- **Response 200:** `{ data: null }`
- **Test notes:** Sau khi logout, gọi `/api/auth/session` sẽ trả 401.

---

### GET /api/auth/session
- **Mục đích:** Kiểm tra session hiện tại, lấy thông tin user đang đăng nhập
- **Auth required:** Cookie `session_token`
- **Response 200:** `{ user: { id, name, email, ... } }`
- **Response 401:** Không có session hoặc session hết hạn
- **Test notes:** Endpoint này dùng để frontend check "đã login chưa" khi reload trang.

---

### GET /api/auth/sign-in/google
- **Mục đích:** Bắt đầu Google OAuth flow — redirect sang Google consent screen
- **Auth required:** Không
- **Response 302:** Redirect tới Google OAuth URL
- **Test notes:** Mở trực tiếp trên browser, không test được qua Postman/curl. Google sẽ redirect về `/api/auth/callback/google`.

---

### GET /api/auth/callback/google
- **Mục đích:** Google OAuth callback — đổi `code` lấy token, tạo/tìm user, set cookie, redirect về frontend
- **Auth required:** Không (handled bởi Google)
- **Query params:** `code` (từ Google), `error` (nếu user từ chối)
- **Response 302:** Redirect về `FRONTEND_URL/dashboard` (thành công) hoặc `FRONTEND_URL/login?error=google_denied`
- **Test notes:** Không test thủ công. Chỉ được gọi bởi Google redirect. Cần `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `API_URL`, `FRONTEND_URL` trong `.env`.

---

## Group: Projects `/api/projects`

> Tất cả endpoints trong group này yêu cầu cookie `session_token` hợp lệ.

### GET /api/projects/mine
- **Mục đích:** Lấy danh sách project của user hiện tại
- **Auth required:** Có
- **Response 200:** Array of projects (kèm plan info), sort mới nhất trước
- **Response 401:** Chưa đăng nhập
- **Test notes:** Gọi sau khi login. Nếu chưa tạo project nào sẽ trả `[]`.

---

### POST /api/projects
- **Mục đích:** Tạo project mới
- **Auth required:** Có
- **Body:** Không cần (tên project tự generate từ nanoid)
- **Response 201:** Project object `{ id, subdomain, status: "CREATING", ... }`
- **Response 403:** Đã đạt giới hạn plan (free plan: tối đa 1 project)
- **Test notes:** Free plan chỉ tạo được 1 project. Tạo lần 2 sẽ trả 403.

---

### POST /api/projects/:id/start
- **Mục đích:** Wake/start container cho project đang STOPPED hoặc ERROR
- **Auth required:** Có
- **Params:** `id` — Project ID (lấy từ `GET /api/projects/mine`)
- **Body:** Không cần
- **Response 200:** `{ status: "STARTING", instanceId: "..." }`
- **Response 400:** Project không ở trạng thái có thể start (vd: đang RUNNING)
- **Response 404/403:** Project không tồn tại hoặc không phải của user
- **Test notes:** Tạo project trước, sau đó gọi start. Status sẽ chuyển sang STARTING (BullMQ worker chưa triển khai → thực tế chưa spawn container).

---

### POST /api/projects/:id/stop
- **Mục đích:** Stop container đang RUNNING hoặc STARTING
- **Auth required:** Có
- **Params:** `id` — Project ID
- **Body:** Không cần
- **Response 200:** `{ status: "STOPPED" }`
- **Response 400:** Project không ở trạng thái có thể stop
- **Test notes:** Gọi sau `/start`. BullMQ stop job chưa triển khai.

---

### GET /api/projects/:id/health
- **Mục đích:** Lấy trạng thái chi tiết project
- **Auth required:** Có
- **Params:** `id` — Project ID
- **Response 200:**
  ```json
  { "status": "STOPPED", "subdomain": "abc12345", "lastActiveAt": null, "storageUsedMb": 0 }
  ```
- **Test notes:** Dùng để poll trạng thái container từ frontend.

---

### GET /api/projects/:id/instances
- **Mục đích:** Lịch sử 20 ContainerInstance gần nhất của project
- **Auth required:** Có
- **Params:** `id` — Project ID
- **Response 200:** Array of `{ id, containerId, status, startedAt, stoppedAt, cpuLimit, ramLimit, nodeId, ... }`
- **Test notes:** Sau khi start/stop vài lần sẽ có data. Trả `[]` nếu chưa start lần nào.

---

### DELETE /api/projects/:id
- **Mục đích:** Xóa project vĩnh viễn (cascade xóa ContainerInstance)
- **Auth required:** Có
- **Params:** `id` — Project ID
- **Body:** Không cần
- **Response 200:** `{ deleted: true }`
- **Response 400:** Project đang RUNNING — phải stop trước
- **Test notes:** Stop project trước khi xóa. Thao tác không thể hoàn tác.

---

## Group: Internal `/api/internal` _(chưa implement)_

> Dùng API key `Authorization: <WORKER_SECRET>` thay vì session cookie.

| Endpoint | Mục đích |
|---|---|
| `POST /api/internal/status` | Worker gửi cập nhật trạng thái container |
| `POST /api/internal/heartbeat` | Worker báo hiệu còn sống |
| `POST /api/internal/wake/:userId` | Trigger wake container cho user |
| `POST /api/internal/job/:jobId/result` | Worker báo kết quả heavy job xong |

---

## Env vars cần thiết để test

| Var | Giá trị ví dụ | Bắt buộc |
|---|---|---|
| `DATABASE_URL` | `postgresql://...@neon.tech/...?sslmode=require` | Có |
| `PORT` | `3001` | Không (default 3001) |
| `FRONTEND_URL` | `http://localhost:3000` | Có (OAuth redirect) |
| `API_URL` | `http://localhost:3001` | Có (OAuth callback) |
| `GOOGLE_CLIENT_ID` | `xxx.apps.googleusercontent.com` | Chỉ cần cho Google OAuth |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | Chỉ cần cho Google OAuth |

---

## Thứ tự test nhanh (happy path)

```
1. POST /api/auth/register         → nhận cookie
2. GET  /api/auth/session           → xác nhận đã login
3. POST /api/projects               → tạo project, lấy id
4. GET  /api/projects/mine          → danh sách projects
5. GET  /api/projects/:id/health    → trạng thái CREATING/STOPPED
6. POST /api/projects/:id/start     → chuyển STARTING
7. GET  /api/projects/:id/instances → xem ContainerInstance mới
8. POST /api/projects/:id/stop      → chuyển STOPPED
9. DELETE /api/projects/:id         → xóa project
10. POST /api/auth/logout           → clear session
```
