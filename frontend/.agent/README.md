# Frontend Agent Documentation

Hướng dẫn develop, test, và deploy frontend.

---

## 📖 Files

### [rule.md](rule.md) — Frontend Coding Rules
**Quy tắc bắt buộc cho toàn bộ contribution:**
- CSS: CSS Modules + Variables (không dùng framework)
- Validation: Zod bắt buộc
- Forms: react-hook-form + zodResolver
- State: Zustand cho global state
- API: Axios instance duy nhất
- Auth: Better-Auth + HttpOnly cookie

**Đọc khi:** bắt đầu code feature mới

---

### [test-local.md](test-local.md) — Complete Testing Guide
**3 cách test frontend + backend trên local:**
1. **Option 1:** Frontend + Mock API (nhanh, UI-focused)
2. **Option 2:** Frontend + Real Backend (đầy đủ, flow-testing)
3. **Option 3:** Backend riêng (debug API trước)

**Bao gồm:** setup steps, test checklist, troubleshooting, cURL examples

**Đọc khi:** muốn test backend/frontend integration

---

### [test-mock-api.md](test-mock-api.md) — Quick Mock API Test
**Quickstart để test UI/UX ngay mà không cần backend:**

Setup:
```bash
cd frontend
npm run dev  # Port 3000
```

Mock data:
- Demo user: `demo@example.com` / `123456`
- 2 sample projects (running + stopped)
- Auto-timing: create (2s), start (3s)

Test flows:
- Login/Register
- Create project
- Start/Stop project
- Polling health
- Logout

**Đọc khi:** dev frontend features, test UI

---

## 🚀 Quick Start

```bash
# 1. Start frontend with mock API (no backend needed)
cd frontend
npm run dev

# 2. Open http://localhost:3000
# 3. Login: demo@example.com / 123456

# When backend is ready:
# 1. Disable mock: .env.local NEXT_PUBLIC_MOCK_API=false
# 2. Set API URL: NEXT_PUBLIC_API_URL=<backend-url>
# 3. Restart dev server
```

---

## 📁 Project Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── (auth)/login + register   # Auth pages
│   ├── (dashboard)/dashboard     # Project list
│   └── (dashboard)/projects/new  # Create project form
├── lib/
│   ├── axios.ts                  # HTTP client
│   ├── api/
│   │   ├── auth.ts              # Auth endpoints
│   │   ├── project.ts           # Project endpoints
│   │   └── mocks/               # Mock API (dev only)
│   │       ├── data.ts          # Mock users + projects
│   │       ├── handlers.ts      # API logic simulation
│   │       ├── interceptor.ts   # Axios hook
│   │       └── index.ts         # Exports
├── schemas/                      # Zod validation
│   ├── auth.schema.ts
│   └── project.schema.ts
├── stores/                       # Zustand state management
│   ├── auth.store.ts
│   └── project.store.ts
├── components/
│   ├── ui/                       # Primitives: Button, Input
│   ├── layout/                   # Sidebar, Header
│   └── project/                  # ProjectCard
└── .agent/                       # Agent docs (this folder)
```

---

## 🎯 Development Flow

### Building a Feature

1. **Read rules:** [rule.md](rule.md)
2. **Add schema:** `schemas/feature.schema.ts` (Zod)
3. **Add store:** `stores/feature.store.ts` (Zustand) if needed
4. **Add API:** `lib/api/feature.ts` (Axios)
5. **Add component:** `components/feature/Component.tsx` + CSS Module
6. **Test:** Mock API or real backend
7. **Update mock:** `lib/api/mocks/handlers.ts` if adding new endpoints

### Testing

- **UI/UX:** Use mock API ([test-mock-api.md](test-mock-api.md))
- **Integration:** Use real backend ([test-local.md](test-local.md) Option 2)
- **API only:** Use cURL ([test-local.md](test-local.md) Option 3)

---

## ⚙️ Environment Variables

```bash
# .env.local

# API
NEXT_PUBLIC_API_URL=http://localhost:3001

# Mock API (dev only)
NEXT_PUBLIC_MOCK_API=true|false  # true = use mock, false = use real API
```

---

## 🔄 Switching Between Mock & Real API

### Use Mock API (Development)
```bash
# .env.local
NEXT_PUBLIC_MOCK_API=true
```
→ Restart dev server: `Ctrl+C` then `npm run dev`

### Use Real Backend
```bash
# .env.local
NEXT_PUBLIC_MOCK_API=false
NEXT_PUBLIC_API_URL=http://localhost:3001  # or production URL
```
→ Restart dev server

---

## 📝 Mock API Features

Pre-loaded data:
- **Users:** `demo@example.com` (any password ≥6 chars)
- **Projects:** 2 samples (Telegram Bot + Discord Bot)

Timing simulation:
- Create project: 2s (creating → running)
- Start project: 3s (starting → running)
- Health polling: 2s interval

Customization:
- Edit `lib/api/mocks/data.ts` for seed data
- Edit `lib/api/mocks/handlers.ts` for logic + timeouts

---

## 🐛 Debugging

### DevTools Tips

**Check if mock API enabled:**
```javascript
// Browser console
console.log(process.env.NEXT_PUBLIC_MOCK_API)
```

**View current state:**
```javascript
// Auth
import { useAuthStore } from '@/stores/auth.store'
console.log(useAuthStore.getState())

// Projects
import { useProjectStore } from '@/stores/project.store'
console.log(useProjectStore.getState())
```

**See API calls:**
- **Real API:** Network tab shows XHR/fetch
- **Mock API:** Console logs (if added) + no network requests

---

## ✅ Checklist Before Commit

- [ ] Rules followed ([rule.md](rule.md))
- [ ] TypeScript: `npm run build` no errors
- [ ] ESLint: `npm run lint` no errors
- [ ] Mock API test: login → create → start flows work
- [ ] No `console.log` left (except debug)
- [ ] No hardcoded values (use CSS variables, env vars, schemas)
- [ ] Forms use Zod + react-hook-form
- [ ] API calls validated with Zod
- [ ] State in Zustand, not useState (global)
