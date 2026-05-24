# @aucobot/workspace-sync

Pure Node helpers: merge DB-shaped rows into `openclaw.json`, compile agents/skills, write MCP credential files.

No NestJS, no Prisma — `apps/api` loads rows from DB and calls this package.

## Build

```bash
pnpm --filter @aucobot/workspace-sync build
```
