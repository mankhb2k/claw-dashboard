# Test Frontend với Mock API

> Mock API enables: Nhanh test UI/UX mà không cần backend thực

---

## Setup

✅ Đã cấu hình sẵn:

```
lib/api/mocks/
├── data.ts          ← Mock users + projects data
├── handlers.ts      ← API logic (auth, projects CRUD)
├── interceptor.ts   ← Axios interceptor hook
└── index.ts         ← Export

.env.local
├── NEXT_PUBLIC_API_URL=http://localhost:3001  (ignored)
└── NEXT_PUBLIC_MOCK_API=true                  ← Enable mock mode
```

---

## Run

```bash
cd frontend
npm run dev
```

→ http://localhost:3000

Mock API **tự động** intercept tất cả axios calls.

---

## Test Flows

### 1️⃣ Login

```
URL: http://localhost:3000/login
Email: demo@example.com
Password: demo123
→ Redirect /dashboard
→ Show 2 mock projects (Telegram Bot + Discord Bot)
```

**Note:** Login bắt buộc phải match chính xác email + password. Demo user chỉ có 1 cặp.
**Error test:** Thử password sai → "Mật khẩu không đúng"

### 2️⃣ Register

```
URL: http://localhost:3000/register
Email: newemail@example.com
Password: newpass123 (≥6 ký tự)
Confirm: newpass123
→ Auto login
→ Redirect /dashboard
→ Projects list trống (user mới)

Sau đó logout → login lại với:
Email: newemail@example.com
Password: newpass123
→ Thành công, projects list vẫn trống
```

**Note:** Password được lưu trong mock data, có thể login lại sau với cặp email/password này.

### 3️⃣ Create Project

```
Dashboard → "+ Tạo project"
Name: my-bot-test
→ Form validation: subdomain = "my-bot-test" (real-time)
→ Submit
→ Card xuất hiện, status "creating"
→ Wait 2s: status tự chuyển → "running"
```

### 4️⃣ Start/Stop Project

```
Card: "Đã dừng" (stopped status)
→ Click "Khởi động"
→ Status: "Đang khởi động..."
→ Polling health mỗi 2s
→ Wait 3s: status → "running"
→ Nút "Mở dashboard" enable

Click "Dừng"
→ Status: "Đã dừng"
→ Nút "Khởi động" hiển thị lại
```

### 5️⃣ Logout

```
Header → Avatar dropdown → "Đăng xuất"
→ Redirect /login
→ Logout handler clear state
```

---

## Mock Data

**Pre-loaded users:**
```
demo@example.com / (bất kỳ password ≥6 ký tự)
```

**Pre-loaded projects:**
```
1. Telegram Bot (running)
2. Discord Bot (stopped)
```

---

## Config Mock API

### Enable/Disable

**Để dùng mock API:**
```bash
# .env.local
NEXT_PUBLIC_MOCK_API=true
```

**Để dùng real backend:**
```bash
# .env.local
NEXT_PUBLIC_MOCK_API=false
# hoặc xoá dòng này
```

Sau khi change env, restart dev server: `Ctrl+C` → `npm run dev`

### Customize Mock Data

Edit `lib/api/mocks/data.ts`:

```typescript
export const mockProjects = new Map<string, Project>([
  [
    '1',
    {
      id: '1',
      name: 'My Custom Project',
      subdomain: 'my-custom',
      status: 'running',  // ← Thay đổi status
      containerId: 'abc123',
      lastActiveAt: new Date().toISOString(),
      createdAt: '2026-04-22T00:00:00Z',
    },
  ],
])
```

---

## Debug Tips

### Check mock API activated

**Browser DevTools → Console:**

```javascript
console.log(process.env.NEXT_PUBLIC_MOCK_API)  // 'true'
```

### Log API calls

**Edit `lib/axios.ts`:**

```typescript
api.interceptors.request.use((config) => {
  console.log('🚀 API Request:', config.method?.toUpperCase(), config.url)
  return config
})

api.interceptors.response.use(
  (res) => {
    console.log('✅ API Response:', res.status, res.data)
    return res
  },
  (err) => {
    console.error('❌ API Error:', err.message)
    // ...
  }
)
```

### Check Zustand state

**Browser Console:**

```javascript
// Xem current user
import { useAuthStore } from '@/stores/auth.store'
console.log(useAuthStore.getState())

// Xem projects
import { useProjectStore } from '@/stores/project.store'
console.log(useProjectStore.getState())
```

---

## Timeout Simulation

Mock API có timeout giả để simulate async operations:

| Operation | Time | Behavior |
|---|---|---|
| **Create project** | 2s | creating → running |
| **Start project** | 3s | starting → running |
| **Stop project** | instant | stopped |
| **Health polling** | 2s interval | mỗi 2s check 1 lần |

Nếu muốn change timeout, edit `lib/api/mocks/handlers.ts`:

```typescript
// Change 2000 ms → 5000 ms
const timer = setTimeout(() => {
  // ...
}, 5000)  // ← Timeout
```

---

## Khi nào chuyển sang Real Backend?

Khi:
- ✅ UI/UX test xong
- ✅ Form validation OK
- ✅ State management logic OK
- ✅ Backend API ready

**Bước chuyển:**

1. Disable mock API: `NEXT_PUBLIC_MOCK_API=false`
2. Update `NEXT_PUBLIC_API_URL` pointing real backend
3. Restart frontend
4. Test flows lại

---

## Checklist

- [ ] Frontend start: `npm run dev`
- [ ] Mock mode enabled: `NEXT_PUBLIC_MOCK_API=true`
- [ ] Login page works: register / login flow
- [ ] Dashboard loads: 2 demo projects visible
- [ ] Create project works: name input + subdomain preview
- [ ] Status transition works: creating → running
- [ ] Start/Stop buttons work: polling active
- [ ] Logout works: redirect to login
- [ ] No console errors
- [ ] Browser DevTools Network tab shows intercepted calls (not real XHR)
