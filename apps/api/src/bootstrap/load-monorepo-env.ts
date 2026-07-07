import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { config } from 'dotenv';

// apps/api/src|dist/bootstrap → apps/
const APPS_ENV_ROOT = resolve(__dirname, '../../..');

/** Load apps/.env (+ .env.local) in local dev only. */
export function loadMonorepoEnv(): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  const envPath = resolve(APPS_ENV_ROOT, '.env');
  if (existsSync(envPath)) {
    config({ path: envPath });
  }

  const localPath = resolve(APPS_ENV_ROOT, '.env.local');
  if (existsSync(localPath)) {
    config({ path: localPath, override: true });
  }
}
