import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadMonorepoEnv } from '../../scripts/load-monorepo-env.mjs';
import { defineConfig } from 'prisma/config';

loadMonorepoEnv();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'npx tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
