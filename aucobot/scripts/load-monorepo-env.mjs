/**
 * Load aucobot/.env (+ .env.local) in local dev only.
 * Production (Vercel, Railway, Docker) injects process.env — no file read.
 */
import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MONOREPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function loadMonorepoEnv() {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  const envPath = resolve(MONOREPO_ROOT, '.env');
  if (existsSync(envPath)) {
    config({ path: envPath });
  }

  const localPath = resolve(MONOREPO_ROOT, '.env.local');
  if (existsSync(localPath)) {
    config({ path: localPath, override: true });
  }
}
