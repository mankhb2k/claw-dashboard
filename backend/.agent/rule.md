# Backend Rules & Best Practices

## Prisma 7 Rules

### ❌ DEPRECATED - Do NOT do this

```typescript
// ❌ WRONG - url property in schema is NOT allowed in Prisma 7
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  // ❌ Invalid in Prisma 7
}
```

### ✅ CORRECT - Prisma 7 Configuration

**In `prisma/schema.prisma`:**
```typescript
// ✅ CORRECT - Provider only, NO url property
datasource db {
  provider = "postgresql"
}
```

**In `prisma.config.ts` (required):**
```typescript
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],  // ✅ URL goes HERE
  },
});
```

**Why?** Prisma 7 separates schema definition from runtime configuration.

---

## Environment Variables Rules

### Database Configuration

| Variable | Location | Usage | Example |
|----------|----------|-------|---------|
| `DATABASE_URL` | `.env`, Railway | Prisma migrations & config | `postgresql://user:pass@host:5432/db` |
| `REDIS_PUBLIC_URL` | `.env`, Railway | Redis connection | `redis://localhost:6379` |

### Authentication

| Variable | Location | Secret? | Usage |
|----------|----------|---------|-------|
| `BETTER_AUTH_SECRET` | `.env`, Railway | ✅ YES | Session encryption |
| `GOOGLE_CLIENT_ID` | `.env`, Railway | ❌ NO | Public, safe in frontend |
| `GOOGLE_CLIENT_SECRET` | `.env`, Railway | ✅ YES | Backend only, never expose |
| `VPS_WORKER_SECRET` | `.env`, Railway | ✅ YES | Backend worker auth |

### URLs

| Variable | Location | Environment | Example |
|----------|----------|-------------|---------|
| `FRONTEND_URL` | `.env`, Railway | `.env`: localhost, Railway: production | Dev: `http://localhost:3000`, Prod: `https://frontend.vercel.app` |
| `API_URL` | `.env`, Railway | `.env`: localhost, Railway: auto-detected | Dev: `http://localhost:3001`, Prod: auto |

---

## .env File Rules

### ✅ DO's

- ✅ Keep `.env` in `.gitignore` (never commit secrets)
- ✅ Create `.env.example` with placeholder values
- ✅ Use single quotes for values: `DATABASE_URL='postgresql://...'`
- ✅ Keep secrets safe: GOOGLE_CLIENT_SECRET, BETTER_AUTH_SECRET, etc.
- ✅ Update both `.env` and Railway variables together

### ❌ DON'Ts

- ❌ Never commit `.env` to git
- ❌ Don't mix DATABASE_URL and DATABASE_PUBLIC_URL
- ❌ Don't expose CLIENT_SECRET to frontend
- ❌ Don't hardcode environment URLs

---

## .env.example Template

```env
# Database (Prisma 7 requires this exact name)
DATABASE_URL='postgresql://user:password@host:5432/dbname?sslmode=require'

# Redis
REDIS_PUBLIC_URL=redis://localhost:6379

# Authentication & Security
BETTER_AUTH_SECRET=<random 32 bytes - generate with: openssl rand -base64 32>
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
VPS_WORKER_SECRET=<random secret>

# URLs
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:3001
```

---

## OAuth/Authentication Rules

### Google OAuth Flow (Backend-Handled)

**Why Backend Handles OAuth?**
- Backend has CLIENT_SECRET (secure, never exposed)
- Frontend can't safely store CLIENT_SECRET
- Authorization Code Flow is most secure

**Endpoints:**
- `GET /api/auth/sign-in/google` - Redirect to Google login
- `GET /api/auth/callback/google` - Receive authorization code
- Backend exchanges code for access token (uses CLIENT_SECRET)

**Requirements:**
- Backend: `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
- Frontend: None (uses backend endpoint)

---

## NestJS Backend Structure Rules

### Auth Module
- Use `auth.service.ts` for login/register logic
- Use `auth.controller.ts` for HTTP endpoints
- Store session tokens in httpOnly cookies (default: `session_token`)
- Implement middleware/guards for protected routes

### Database Access
- Use PrismaService for all database operations
- Never use raw SQL unless necessary
- Keep migrations in `prisma/migrations/`

### Environment & Config
- Always check `process.env` exists before using
- Use `.env` for local development, Railway variables for production
- Never log sensitive data (passwords, tokens, secrets)

---

## Docker Build Rules

### Build Process
1. `RUN npx prisma generate` - Must run BEFORE `npm run build` in builder stage
2. Prisma config must be correct (see Prisma 7 rules above)
3. DATABASE_URL must be available during migration (if using `prisma migrate deploy`)

### ⚠️ CRITICAL: Runtime Prisma Setup

**Problem:** Generated Prisma files from builder stage may not include all engine files needed at runtime. Always regenerate in runtime container.

**Solution:** Run `npx prisma generate` in CMD before starting app:

```dockerfile
# ✅ CORRECT - Regenerate Prisma at startup
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && node dist/src/main"]

# ❌ WRONG - Skip generation, rely only on builder stage
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]
```

### Multi-Stage Build Example (v1.0.3+)
```dockerfile
# builder stage
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# runtime stage
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma
COPY prisma.config.ts ./

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

# ✅ Generate + Migrate + Start
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && node dist/src/main"]
```

### Deployment Checklist
- ✅ Both builder and runtime stages have Prisma files copied
- ✅ Runtime stage regenerates Prisma client at startup
- ✅ DATABASE_URL available at runtime (Railway env var)
- ✅ prisma.config.ts copied to runtime container
- ✅ prisma/migrations/ folder copied (not excluded by .dockerignore)
- ✅ CMD runs migrations before app start

---

## Railway Deployment Rules

### Required Variables
```
DATABASE_URL=postgresql://...
REDIS_PUBLIC_URL=redis://...
BETTER_AUTH_SECRET=<secret>
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FRONTEND_URL=https://your-frontend.vercel.app
VPS_WORKER_SECRET=<secret>
```

### Don't Include
- ❌ DATABASE_PUBLIC_URL (use DATABASE_URL only)
- ❌ API_URL (Railway auto-assigns)

### Troubleshooting
- If `DATABASE_URL required` error: Check variables in Railway dashboard
- If Docker build fails: Verify DATABASE_URL exists before running prisma generate
- If migrations fail: Ensure DATABASE_URL is set and database is accessible
- **If Prisma client generation fails at startup:** Add `npx prisma generate` to CMD before migrations (v1.0.3+ fix)
- If "No Prisma Client" error in Docker: Ensure `node_modules/@prisma` and `node_modules/.prisma` are copied from builder
- If migrations are "pending": DATABASE_URL may be wrong or database unreachable

---

## Common Mistakes to Avoid

| Mistake | Impact | Fix |
|---------|--------|-----|
| Prisma 7 with `url` in schema | Build fails | Remove `url` from schema, use `prisma.config.ts` |
| DATABASE_PUBLIC_URL instead of DATABASE_URL | Runtime error | Rename all to DATABASE_URL |
| DATABASE_URL not in Railway | Container crashes | Add variable to Railway dashboard |
| CLIENT_SECRET exposed in frontend | Security breach | Backend only, never use in frontend code |
| URL hardcoded instead of env var | Broken in production | Use `process.env.FRONTEND_URL` |
| Forgetting `prisma.config.ts` | Build fails | Create file with datasource config |
| Prisma files not regenerated at runtime | Docker startup fails | Add `npx prisma generate` to CMD before app start |
| Skip migrations in Docker CMD | DB out of sync | Always run `npx prisma migrate deploy` in CMD |
| prisma/ folder excluded by .dockerignore | Migrations not copied | Verify .dockerignore doesn't exclude prisma/ |

---

## Version Reference

- **Prisma:** 7.x (requires config in separate file)
- **NestJS:** Latest (check package.json)
- **Node:** 24-alpine (Docker)
- **Database:** PostgreSQL (Neon)
- **Redis:** Latest

---

## Related Files

- Backend config: `backend/prisma.config.ts`
- Schema definition: `backend/prisma/schema.prisma`
- Environment template: `backend/.env.example`
- Auth service: `backend/src/auth/auth.service.ts`
- OAuth handler: `backend/src/auth/google.oauth.ts`
