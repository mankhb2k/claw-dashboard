# Better Auth Cutover Runbook

## Preconditions

- Deploy code with Better Auth integration.
- Ensure `BETTER_AUTH_SECRET`, `API_URL`, `FRONTEND_URL`, `DATABASE_URL`, and `REDIS_URL` are set.
- Run Prisma migration for auth schema updates:
  - `npx prisma migrate deploy`
  - `npx prisma generate`

## Staging Verification

- Sign up with email/password via `POST /api/auth/sign-up/email`.
- Sign in via `POST /api/auth/sign-in/email`.
- Validate session via `GET /api/auth/get-session`.
- Sign out via `POST /api/auth/sign-out`.
- Test protected routes:
  - `GET /api/projects/mine`
  - `POST /api/projects`
  - `POST /api/heavy/submit`
- Test Google OAuth via `GET /api/auth/sign-in/social?provider=google`.

## Canary Rollout

1. Deploy to a single production instance.
2. Monitor for 15-30 minutes:
   - 401 error rate
   - 5xx error rate on `/api/auth/*`
   - OAuth callback failures
3. Expand to 50% traffic, then 100% if metrics are stable.

## Rollback

- Roll back to previous backend image/tag.
- Keep migrated columns; they are additive and backward-safe for old auth schema.
- Invalidate problematic sessions by clearing `sessions` table if cookie/session mismatch appears.

## Post-Cutover Cleanup

- Remove old frontend assumptions for `session_token`.
- Keep e2e auth tests aligned to Better Auth endpoints.
- Update API docs and onboarding docs.
