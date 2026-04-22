# Hướng Dẫn Test Frontend + Backend Local

> Updated: 2026-04-22  
> Database: Neon PostgreSQL (cloud, không cần chạy local)  
> Redis: Docker local  
> VPS Worker / VPS Heavy: KHÔNG cần cho dev

---

## Tổng quan môi trường dev

```
Browser (localhost:3000)
    ↓ HTTP + cookie
Frontend — Next.js (localhost:3000)
    ↓ axios + session_token cookie
Backend — NestJS/Fastify (localhost:3001)
    ↓ Prisma ORM
PostgreSQL — Neon cloud (đã có sẵn trong .env)
    ↓ BullMQ
Redis — Docker local (localhost:6379)
```

**Không cần:** VPS Worker, VPS Heavy, Traefik, Docker daemon (trừ Redis)

---

## Bước 1 — Khởi động Redis

Redis cần thiết cho BullMQ queue. Chạy bằng Docker:

```bash
# Terminal 1
cd d:/NextJS/openclaw-saas/backend

# Chỉ chạy Redis (không cần postgres vì DB đã trên Neon)
docker compose up redis -d

# Verify
docker compose ps
# redis   running   0.0.0.0:6379->6379/tcp
```

> **Nếu không có Docker:** Dùng Redis cloud (Upstash free tier) và update `REDIS_URL` trong `backend/.env`

---

## Bước 2 — Khởi động Backend

```bash
# Terminal 2
cd d:/NextJS/openclaw-saas/backend

# Cài dependencies (lần đầu)
npm install

# Chạy migration để sync DB schema với Neon
npx prisma migrate deploy

# Seed dữ liệu Plans (free/pro) nếu chưa có
npx prisma db seed 2>/dev/null || true

# Start backend dev server
npm run dev
```

**Verify backend:**
```
✅ Console: "Listening on http://0.0.0.0:3001"
✅ Swagger: http://localhost:3001/api/docs
```

---

## Bước 3 — Khởi động Frontend

```bash
# Terminal 3
cd d:/NextJS/openclaw-saas/frontend

# Đảm bảo .env.local đúng
cat .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3001
# NEXT_PUBLIC_MOCK_API=false   ← phải là false khi test real backend

# Start frontend
npm run dev
```

**Verify frontend:**
```
✅ http://localhost:3000 → redirect về /login
```

---

## Bước 4 — Test Các Flow

### 4.1 Đăng ký

```
URL: http://localhost:3000/register
→ Nhập email + password (≥6 ký tự)
→ Submit
→ Backend: POST /api/auth/register
→ Set cookie: session_token (httpOnly)
→ Redirect: /dashboard
```

**Kiểm tra:** Browser DevTools → Application → Cookies → localhost:3000  
→ Cookie `session_token` xuất hiện

---

### 4.2 Đăng nhập

```
URL: http://localhost:3000/login
→ Nhập email + password vừa đăng ký
→ Submit
→ Backend: POST /api/auth/login
→ Refresh session_token cookie
→ Redirect: /dashboard
```

---

### 4.3 Tạo Project

```
URL: http://localhost:3000/projects/new
→ Nhập tên project (chữ thường, số, dấu gạch ngang)
→ Xem subdomain preview cập nhật real-time
→ Submit
→ Backend: POST /api/projects
→ Project card xuất hiện với status "creating"
```

> **Lưu ý:** Backend enqueue job BullMQ để spawn container.  
> Vì không có VPS Worker, status sẽ giữ nguyên `CREATING`.  
> **Đây là bình thường** — kiểm tra API logic, không phải container thực tế.

---

### 4.4 Xem Danh Sách Projects

```
URL: http://localhost:3000/dashboard
→ Backend: GET /api/projects/mine
→ Hiển thị danh sách projects của user hiện tại
```

---

### 4.5 Đăng xuất

```
Header → Avatar → Đăng xuất
→ Backend: POST /api/auth/logout
→ Cookie session_token bị xóa
→ Redirect: /login
→ Thử truy cập /dashboard → bị redirect về /login ✓
```

---

### 4.6 Kiểm tra Middleware

```bash
# Mở tab mới, chưa đăng nhập
http://localhost:3000/dashboard
→ Redirect về /login ✓

http://localhost:3000/login  (đã đăng nhập)
→ Redirect về /dashboard ✓
```

---

## Bước 5 — Test API Trực Tiếp (Swagger)

Backend có Swagger UI ở `http://localhost:3001/api/docs`

### Test với Swagger:

1. Mở `http://localhost:3001/api/docs`
2. POST `/api/auth/register` → Authorize cookie
3. GET `/api/auth/session` → Xem user hiện tại
4. GET `/api/projects/mine` → Xem projects
5. POST `/api/projects` → Tạo project

### Test với cURL:

```bash
# Register
curl -c cookies.txt -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}' | jq

# Login
curl -c cookies.txt -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' | jq

# Get session
curl -b cookies.txt -s http://localhost:3001/api/auth/session | jq

# Create project
curl -b cookies.txt -s -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"my-bot"}' | jq

# List projects
curl -b cookies.txt -s http://localhost:3001/api/projects/mine | jq
```

---

## Cấu Trúc Response Backend

Backend bọc tất cả response trong wrapper — frontend tự unwrap:

```json
// Success
{
  "success": true,
  "data": { ... },
  "error": null
}

// Error
{
  "success": false,
  "data": null,
  "error": { "code": "AUTH_INVALID_CREDENTIALS", "message": "..." }
}
```

Frontend `lib/axios.ts` tự động unwrap: `res.data = res.data.data`

---

## Checklist Đầy Đủ

### Setup
- [ ] Docker Redis đang chạy (`docker compose up redis -d`)
- [ ] Backend start thành công (`npm run dev` → port 3001)
- [ ] Frontend start thành công (`npm run dev` → port 3000)
- [ ] `.env.local` có `NEXT_PUBLIC_MOCK_API=false`

### Auth
- [ ] Register: form submit → cookie `session_token` set
- [ ] Login: đúng credentials → redirect /dashboard
- [ ] Login: sai password → "Lỗi không xác định" hoặc "Invalid credentials"
- [ ] Logout: cookie xóa, redirect /login
- [ ] Middleware: /dashboard không cookie → redirect /login

### Projects
- [ ] GET /api/projects/mine → list trả về (trống nếu chưa tạo)
- [ ] POST /api/projects → project tạo với status CREATING
- [ ] Dashboard hiển thị project card

### DevTools Checks
- [ ] Network tab: request gửi lên localhost:3001 (không phải mock)
- [ ] Cookies: `session_token` xuất hiện sau login
- [ ] Console: không có CORS error
- [ ] Console: không có Zod parse error

---

## Troubleshooting

| Lỗi | Nguyên nhân | Giải pháp |
|---|---|---|
| `CORS error` | Backend CORS chưa include localhost:3000 | Check `main.ts` CORS config, backend đang chạy chưa |
| `ECONNREFUSED` | Backend chưa start | `cd backend && npm run dev` |
| `Zod parse error` | Schema frontend ≠ response backend | Xem console, check field names |
| `session_token` không set | Cookie config sai | Backend `NODE_ENV=development` thì `secure: false` |
| `401 Not authenticated` | Cookie không gửi | Axios `withCredentials: true` ✓, CORS `credentials: true` ✓ |
| Status giữ nguyên CREATING | VPS Worker không chạy | Bình thường trong dev — queue job chờ worker |
| Redis connection error | Docker Redis chưa chạy | `docker compose up redis -d` |
| `prisma migrate` fail | DB schema mismatch | `npx prisma migrate reset` (xóa data) hoặc `deploy` |

---

## Lệnh Nhanh — Khởi Động Tất Cả

```bash
# Terminal 1: Redis
cd d:/NextJS/openclaw-saas/backend && docker compose up redis -d

# Terminal 2: Backend
cd d:/NextJS/openclaw-saas/backend && npm run dev

# Terminal 3: Frontend (MOCK_API=false)
cd d:/NextJS/openclaw-saas/frontend && npm run dev

# Browser
# http://localhost:3000  → Frontend
# http://localhost:3001/api/docs  → Swagger API
```

---

## Tắt Môi Trường Dev

```bash
# Tắt dev servers: Ctrl+C trong mỗi terminal

# Tắt Redis Docker
cd d:/NextJS/openclaw-saas/backend
docker compose down
```
