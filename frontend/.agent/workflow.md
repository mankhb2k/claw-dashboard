# Frontend Workflow — OpenClaw SaaS

> Status: MVP Complete · 2026-04-22  
> Framework: Next.js 16.2.4 + React 19.2.4 + TypeScript 5  
> State: Zustand · Validation: Zod · Forms: react-hook-form

---

## Current State

### ✅ Implemented

#### Auth Pages
- **Login** (`/login`): email + password form with Zod validation
- **Register** (`/register`): email + password + confirm with validation
- **Middleware**: Protect routes, redirect unauthenticated users to `/login`
- **Auth Store**: Zustand store with `login()`, `register()`, `logout()`, `fetchMe()`

#### Dashboard
- **Layout**: Sidebar + Header with logo, nav, user dropdown
- **Dashboard Home** (`/dashboard`): Project list with cards + "Create" button
- **Create Project Form** (`/projects/new`): Name input with live subdomain preview
- **Project Card**: Status badge, Start/Stop buttons, Open link, polling on start

#### API Integration
- **Axios Instance**: Single `api` client with `withCredentials: true`
- **API Modules**: `lib/api/auth.ts`, `lib/api/project.ts`
- **Schemas**: Zod validation for all inputs/outputs (auth + project)
- **Stores**: Zustand stores for global state (auth + projects)

#### UI Components
- **Button**: Primary, Ghost, Danger variants + loading spinner
- **Input**: Label + error display + focus ring
- **ProjectCard**: Status badge, actions, polling integration
- **Layout**: Sidebar, Header with user menu

#### Mock API (Dev Only)
- Pre-loaded users + 2 sample projects
- Full CRUD simulation with timing (create: 2s, start: 3s)
- Auto-interceptor when `NEXT_PUBLIC_MOCK_API=true`

---

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # → /dashboard redirect
│   ├── globals.css                   # CSS variables, reset
│   ├── (auth)/
│   │   ├── layout.tsx                # Centered card layout
│   │   ├── login/page.tsx            # Login form + link to register
│   │   └── register/page.tsx         # Register form + link to login
│   └── (dashboard)/
│       ├── layout.tsx                # Sidebar + main area
│       ├── dashboard/page.tsx        # Project list home
│       └── projects/new/page.tsx     # Create project form
├── components/
│   ├── ui/
│   │   ├── Button/Button.tsx         # Reusable button (primary/ghost/danger)
│   │   └── Input/Input.tsx           # Reusable input with validation
│   ├── layout/
│   │   ├── Sidebar/Sidebar.tsx       # Nav sidebar
│   │   └── Header/Header.tsx         # Top header with user menu
│   └── project/
│       └── ProjectCard/ProjectCard.tsx  # Project display + actions
├── lib/
│   ├── axios.ts                      # Axios config + interceptors
│   ├── api/
│   │   ├── auth.ts                   # login, register, logout, me
│   │   ├── project.ts                # list, create, start, stop, health, destroy
│   │   └── mocks/
│   │       ├── data.ts               # Mock users + projects
│   │       ├── handlers.ts           # API simulation logic
│   │       ├── interceptor.ts        # Axios interceptor hook
│   │       └── index.ts              # Exports
├── schemas/
│   ├── auth.schema.ts                # Zod: login, register, user
│   └── project.schema.ts             # Zod: project, create, status
├── stores/
│   ├── auth.store.ts                 # Zustand: user + auth actions
│   └── project.store.ts              # Zustand: projects + CRUD + polling
├── middleware.ts                     # Route protection (check session cookie)
├── .env.local                        # API_URL, MOCK_API flag
├── .agent/
│   ├── README.md                     # Docs index
│   ├── rule.md                       # Coding rules
│   ├── test-local.md                 # Testing guide
│   ├── test-mock-api.md              # Mock API quickstart
│   └── workflow.md                   # This file
└── tsconfig.json, package.json, next.config.ts, etc.
```

---

## Dependencies

### Node Packages
```json
{
  "next": "16.2.4",
  "react": "19.2.4",
  "zod": "^3.x",
  "react-hook-form": "^7.x",
  "@hookform/resolvers": "^3.x",
  "axios": "^1.x",
  "zustand": "^4.x"
}
```

### Backend API (Required for Production)
- **Endpoint:** `NEXT_PUBLIC_API_URL` (default: http://localhost:3001)
- **Auth:** Better-Auth (session cookie: HttpOnly)
- **Endpoints needed:**
  - `POST /api/auth/login` → `{ id, email, name, createdAt }`
  - `POST /api/auth/register` → `{ id, email, name, createdAt }`
  - `POST /api/auth/logout` → `{}`
  - `GET /api/auth/me` → `{ id, email, name, createdAt }`
  - `GET /api/projects` → `[{ id, name, subdomain, status, containerId, lastActiveAt, createdAt }]`
  - `POST /api/projects` → `{ id, name, subdomain, status: 'creating', ... }`
  - `POST /api/projects/:id/start` → `{}`
  - `POST /api/projects/:id/stop` → `{}`
  - `GET /api/projects/:id/health` → `{ status, url }`
  - `DELETE /api/projects/:id` → `{}`

---

## Development Workflow

### Adding a New Feature

1. **Define schema** (`schemas/feature.schema.ts`)
   ```typescript
   import { z } from 'zod'
   export const featureSchema = z.object({ ... })
   export type Feature = z.infer<typeof featureSchema>
   ```

2. **Define store** (`stores/feature.store.ts`) if global state needed
   ```typescript
   import { create } from 'zustand'
   export const useFeatureStore = create<State>((set, get) => ({ ... }))
   ```

3. **Define API functions** (`lib/api/feature.ts`)
   ```typescript
   import { api } from '@/lib/axios'
   export const featureApi = { fetch: async () => { ... } }
   ```

4. **Create component** (`components/feature/Feature.tsx` + `.module.css`)
   - Use `react-hook-form` for forms
   - Use Zod schema in `zodResolver()`
   - All CSS in `Feature.module.css` (CSS variables, no hardcode)

5. **Add to mock API** (`lib/api/mocks/handlers.ts`)
   - Intercept endpoint for dev testing
   - Add timing simulation if async

6. **Test**
   - Mock API: `NEXT_PUBLIC_MOCK_API=true` → `npm run dev`
   - Real backend: `NEXT_PUBLIC_MOCK_API=false` → point to backend → `npm run dev`

### Running Locally

**Option 1: Mock API (UI Development)**
```bash
# .env.local
NEXT_PUBLIC_MOCK_API=true

# Terminal
npm run dev
# http://localhost:3000
```

**Option 2: Real Backend**
```bash
# Start backend first (NestJS on port 3001)
cd ../openclaw-backend
npm run dev

# Then frontend
cd frontend
npm run dev
NEXT_PUBLIC_MOCK_API=false
# http://localhost:3000
```

### Common Tasks

#### Update CSS Variables
**File:** `app/globals.css`
```css
:root {
  --color-primary: #7c6af7;
  --space-4: 16px;
  /* ... */
}
```
All components auto-update (uses CSS variable references).

#### Add New Auth Endpoint
1. Add function in `lib/api/auth.ts`
2. Parse response with Zod
3. Call from `useAuthStore()`
4. Add mock handler in `lib/api/mocks/handlers.ts`

#### Add New Project Status
1. Update `projectStatusSchema` in `schemas/project.schema.ts`
2. Add badge styling in `ProjectCard.module.css`
3. Update `STATUS_LABEL` map in `ProjectCard.tsx`

#### Fix TypeScript Error
```bash
npx tsc --noEmit  # Check errors
npm run build     # Full build + errors
```

#### Test with cURL (Backend)
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

---

## Known Limitations & TODO

### Current Limitations
- **No OAuth yet**: Better-Auth configured on backend, frontend ready to use
- **No settings page**: Placeholder in sidebar, not implemented
- **No project details page**: Can only view list + create
- **No real health check retry**: Polling stops if error (should retry)
- **Middleware cookie detection**: Hardcoded cookie name, match backend actual name
- **No error toast/notification**: Uses inline errors only
- **No loading skeleton**: Uses spinner, no skeleton UI
- **Mobile nav**: No hamburger menu, sidebar always visible

### Backlog
- [ ] Settings page (`/settings`)
- [ ] Project details page (`/projects/:id`)
- [ ] Settings form (email, password change)
- [ ] Notifications/toast system
- [ ] Real OAuth (Google sign-in button)
- [ ] Project logs viewer
- [ ] Container resource usage display
- [ ] Dark mode toggle (CSS ready, no UI)
- [ ] Mobile responsive nav menu
- [ ] Keyboard shortcuts (e.g. Cmd+K search)

---

## Testing Checklist

### Auth Flow
- [ ] Register with email + password
- [ ] Register: validation on client (Zod) before submit
- [ ] Login: email/password validation
- [ ] Login failure: show error message
- [ ] Logout: redirect to login + clear state
- [ ] Middleware: unauthenticated → redirect /login
- [ ] Middleware: authenticated → can access /dashboard

### Dashboard Flow
- [ ] Load project list (should show 2 mock projects if mock API)
- [ ] Create project: open form, input name
- [ ] Create project: subdomain preview updates real-time
- [ ] Create project: submit → project card appears
- [ ] Project status: "creating" → "running" (2s in mock)
- [ ] Start project: status "starting" → "running" (3s in mock)
- [ ] Stop project: status → "stopped"
- [ ] Open dashboard link: href = `https://subdomain.openclaw.ai`
- [ ] Health polling: every 2s when starting

### UI/UX
- [ ] CSS variables work: change --color-primary → all buttons update
- [ ] Form validation: red border + error message on invalid
- [ ] Button loading: spinner visible, button disabled
- [ ] Responsive: works on 1024px, 768px, 400px widths
- [ ] Dark mode: readable in dark terminal/IDE
- [ ] No hardcoded colors/spacing (all use CSS vars)

### Browser DevTools
- [ ] Console: no errors, no warnings
- [ ] Network: API calls visible (if not mock), cookie header sent
- [ ] Application → Cookies: session cookie present after login
- [ ] TypeScript: `npm run build` no errors

---

## Troubleshooting

| Issue | Solution |
|---|---|
| **Mock API not intercepting** | Check `NEXT_PUBLIC_MOCK_API=true` in `.env.local`, restart dev server |
| **Login fails** | Check backend running (if real API), check `NEXT_PUBLIC_API_URL` |
| **Cookie not sent** | Axios config: `withCredentials: true` ✓, backend CORS: `credentials: true` |
| **Zustand state empty** | Might need `await fetchMe()` in RootLayout or initial effect |
| **CSS not updating** | Restart dev server if CSS vars changed, check `.module.css` file |
| **TypeScript errors** | Run `npx tsc --noEmit`, `npm run build`, or check IDE settings |
| **Middleware redirects to /login** | Check cookie name in `middleware.ts`, match backend session cookie name |

---

## Backend Integration Checklist

When backend is ready:

- [ ] Verify endpoints match schema (auth + project)
- [ ] Test auth: login → response includes `id, email, name, createdAt`
- [ ] Test session: login → response `Set-Cookie`, next request sends cookie
- [ ] Test CORS: `credentials: true`, origin = frontend URL
- [ ] Update middleware: correct session cookie name (replace `better-auth.session_token`)
- [ ] Disable mock API: `NEXT_PUBLIC_MOCK_API=false`
- [ ] Set `NEXT_PUBLIC_API_URL` to backend URL
- [ ] Run full test: register → login → create → start → health check
- [ ] Monitor console: check for Zod validation errors, API error messages

---

## Deployment Notes

### Production Build
```bash
npm run build   # Next.js static + API export
npm run start   # Start production server
```

### Environment Variables (Production)
```bash
NEXT_PUBLIC_API_URL=https://api.openclaw.ai  # Real backend
# NEXT_PUBLIC_MOCK_API=false (or omit)
```

### Hosting Options
- **Vercel**: Recommended (Next.js native, auto-deploy from git)
- **Cloudflare Pages**: Fast, edge compute
- **Railway**: Same provider as backend, easy integration
- **Self-hosted**: Docker + Node.js

---

## File Quick Reference

| File | Purpose | Edit When |
|---|---|---|
| `app/globals.css` | CSS variables, reset | Change colors, spacing, fonts |
| `middleware.ts` | Route protection | Change auth cookie name |
| `stores/*.ts` | Global state logic | Change state shape, add actions |
| `lib/api/*.ts` | API client functions | Add endpoints, change response parsing |
| `schemas/*.ts` | Validation schemas | Change form/API contract |
| `components/**/*.tsx` | UI components | Design/layout changes |
| `.env.local` | Dev config | Change API URL, toggle mock |

---

## Resources

- **Main docs:** [.agent/README.md](README.md)
- **Coding rules:** [.agent/rule.md](rule.md)
- **Testing guide:** [.agent/test-local.md](test-local.md)
- **Mock API quick:** [.agent/test-mock-api.md](test-mock-api.md)
- **Project workflow:** [../../workflow.md](../../workflow.md) (root)

---

**Last Updated:** 2026-04-22  
**Next Review:** When backend MVP is deployed
