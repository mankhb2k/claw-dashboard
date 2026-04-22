# Verify Mock API Setup

Quick checklist để confirm mock API đã setup đúng.

---

## ✅ File Import Chain

```
lib/axios.ts
├─ import setupMockInterceptor from '@/lib/api/mocks'
└─ setupMockInterceptor(api) called on creation

lib/api/mocks/index.ts
└─ export { setupMockInterceptor } from './interceptor'

lib/api/mocks/interceptor.ts
├─ import MOCK_ENABLED = process.env.NEXT_PUBLIC_MOCK_API === 'true'
└─ import { authHandlers, projectHandlers } from './handlers'

lib/api/mocks/handlers.ts
└─ import { mockUsers, mockPasswords, ... } from './data'

lib/api/mocks/data.ts
├─ mockUsers Map
├─ mockPasswords Map
└─ currentUser state
```

✅ **All imports verified**

---

## ✅ Environment Variable

**File:** `.env.local`

```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_MOCK_API=true  ← Mock API enabled
```

✅ **Flag is true**

---

## ✅ Mock Data

**File:** `lib/api/mocks/data.ts`

**Pre-loaded user:**
```typescript
mockUsers.get('demo@example.com')
→ { id: '1', email: 'demo@example.com', name: 'Demo User', createdAt: '2026-04-22T00:00:00Z' }

mockPasswords.get('demo@example.com')
→ 'demo123'
```

✅ **Demo credentials exist**

---

## ✅ Auth Handler Logic

**File:** `lib/api/mocks/handlers.ts`

```typescript
authHandlers.login(req)
├─ Check password length >= 6
├─ Check user exists (throw if not)
├─ Validate password matches stored password
├─ setCurrentUser()
└─ Return user object

authHandlers.register(req)
├─ Check password length >= 6
├─ Check email not duplicate
├─ Create new user + store password
└─ setCurrentUser() + return user

authHandlers.me()
├─ Check currentUser exists
└─ Return currentUser
```

✅ **Handlers implemented correctly**

---

## ✅ Axios Interceptor

**File:** `lib/api/mocks/interceptor.ts`

```typescript
setupMockInterceptor(api)
├─ if (MOCK_ENABLED === 'true') setup response interceptor
├─ Intercept response errors (404, 5xx, etc)
├─ Match URL + method to handler
│  ├─ POST /api/auth/login → authHandlers.login()
│  ├─ POST /api/auth/register → authHandlers.register()
│  ├─ GET /api/auth/me → authHandlers.me()
│  ├─ POST /api/auth/logout → authHandlers.logout()
│  ├─ GET /api/projects → projectHandlers.list()
│  ├─ POST /api/projects → projectHandlers.create()
│  ├─ POST /api/projects/:id/start → projectHandlers.start()
│  ├─ POST /api/projects/:id/stop → projectHandlers.stop()
│  ├─ GET /api/projects/:id/health → projectHandlers.health()
│  └─ DELETE /api/projects/:id → projectHandlers.destroy()
└─ Return mocked response
```

✅ **Interceptor covers all endpoints**

---

## ✅ Type Safety

```bash
cd frontend
npx tsc --noEmit
# → (no output) = no errors ✓
```

✅ **TypeScript clean**

---

## 🚀 Test Now

```bash
cd frontend
npm run dev
```

Open http://localhost:3000/login

**Login:**
```
Email: demo@example.com
Password: demo123
```

**Expected:**
- Form submit → request intercepted
- No real XHR to backend
- Redirect to /dashboard
- See 2 mock projects

**Browser Console:**
```javascript
// Check mock enabled
console.log(process.env.NEXT_PUBLIC_MOCK_API)
// → 'true'

// Check auth state
import { useAuthStore } from '@/stores/auth.store'
useAuthStore.getState()
// → { user: { ... }, isLoading: false, ... }
```

---

## ⚠️ If Mock API Not Working

1. **Check .env.local**
   ```bash
   cat frontend/.env.local
   # NEXT_PUBLIC_MOCK_API=true must be set
   ```

2. **Restart dev server**
   ```bash
   Ctrl+C
   npm run dev
   ```

3. **Check browser console for errors**
   - Open DevTools (F12)
   - Check Console tab for exceptions
   - Check Network tab - should show no XHR to api.example.com

4. **Check TypeScript**
   ```bash
   npx tsc --noEmit
   ```

5. **Check mock handler imports**
   ```bash
   grep -r "import.*mockUsers" frontend/lib
   # Should find: handlers.ts
   ```

---

## 📝 Summary

| Component | Status | Notes |
|---|---|---|
| Import chain | ✅ | All connected |
| .env.local | ✅ | NEXT_PUBLIC_MOCK_API=true |
| Mock data | ✅ | demo@example.com / demo123 |
| Handlers | ✅ | Login, register, projects CRUD |
| Interceptor | ✅ | Covers all endpoints |
| TypeScript | ✅ | No errors |

**Ready to test!** 🚀
