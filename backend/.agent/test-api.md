# API Testing Procedure — OpenClaw Backend

> Quy trình test API chuẩn. Chạy lại sau mỗi lần thêm/sửa endpoint.  
> Log kết quả lưu tại `testing-log/YYYY-MM-DD_HH-MM.md`

---

## Điều kiện tiên quyết

```bash
# 1. Server phải đang chạy
npm run start:dev   # hoặc start:prod

# 2. Kiểm tra server sống
curl http://localhost:3001/health
# Expected: {"success":true,"data":{"status":"ok","uptime":...},"error":null}

# 3. Cookie jar tạm
COOKIE_JAR=/tmp/openclaw_test_cookies.txt
rm -f $COOKIE_JAR
```

---

## Auth Endpoints

### T1 — Register hợp lệ
```bash
curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@openclaw.ai","password":"Test@123456","name":"Test User"}' \
  -c $COOKIE_JAR
```
**Expected:** `200` · `success:true` · `data.user` có id, name, email · cookie `session_token` được set

---

### T2 — Register email trùng
```bash
curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@openclaw.ai","password":"Test@123456","name":"Test User"}'
```
**Expected:** `409` · `success:false` · `error.code: "CONFLICT"`

---

### T3 — Register thiếu field
```bash
curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"x@x.com","password":"123"}'
```
**Expected:** `400` · `success:false` · `error.code: "BAD_REQUEST"`

---

### T4 — Login đúng credentials
```bash
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@openclaw.ai","password":"Test@123456"}' \
  -c $COOKIE_JAR
```
**Expected:** `200` · `success:true` · `data.user` khớp email · cookie được refresh

---

### T5 — Login sai password
```bash
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@openclaw.ai","password":"wrongpassword"}'
```
**Expected:** `401` · `success:false` · `error.code: "AUTH_UNAUTHENTICATED"`

---

### T6 — Get session có cookie
```bash
curl -s http://localhost:3001/api/auth/session \
  -b $COOKIE_JAR
```
**Expected:** `200` · `success:true` · `data.user` trả về user đang login

---

### T7 — Get session không có cookie
```bash
curl -s http://localhost:3001/api/auth/session
```
**Expected:** `200` · `success:false` · `error.code: "AUTH_UNAUTHENTICATED"`

---

### T8 — Logout rồi check session
```bash
curl -s -X POST http://localhost:3001/api/auth/logout \
  -b $COOKIE_JAR -c $COOKIE_JAR

curl -s http://localhost:3001/api/auth/session \
  -b $COOKIE_JAR
```
**Expected logout:** `200` · `success:true` · `data:null`  
**Expected session sau logout:** `success:false` · `AUTH_UNAUTHENTICATED`

---

### T9 — Google OAuth redirect
```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}" \
  http://localhost:3001/api/auth/sign-in/google
```
**Expected:** `302` · redirect URL chứa `accounts.google.com/o/oauth2/v2/auth`

---

## Cleanup sau test

```bash
# Xóa user test khỏi DB (chạy trong prisma studio hoặc psql)
# DELETE FROM users WHERE email = 'testuser@openclaw.ai';
rm -f $COOKIE_JAR
```

---

## Cách chạy toàn bộ tự động

```bash
# Từ thư mục backend/
bash scripts/run-tests.sh 2>&1 | tee testing-log/$(date +%Y-%m-%d_%H-%M).md
```

---

## Checklist kết quả

| ID | Test case | Expected | Pass/Fail |
|---|---|---|---|
| T1 | Register hợp lệ | 200 success | |
| T2 | Register email trùng | 409 CONFLICT | |
| T3 | Register thiếu field | 400 BAD_REQUEST | |
| T4 | Login đúng | 200 success | |
| T5 | Login sai password | 401 AUTH_UNAUTHENTICATED | |
| T6 | Session có cookie | 200 success + user | |
| T7 | Session không cookie | AUTH_UNAUTHENTICATED | |
| T8 | Logout → session | session bị xóa | |
| T9 | Google redirect | 302 → accounts.google.com | |
