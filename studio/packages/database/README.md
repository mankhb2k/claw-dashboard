# @claw-dashboard/database

Prisma schema, migrations, generated client re-exports, and `createPrismaClient()`.

Self-host default user seeding stays in `apps/api` (`DefaultUserService`).

## Scripts (from `studio/` root)

```bash
pnpm db:migrate
pnpm db:seed
pnpm --filter @claw-dashboard/database db:deploy
```
