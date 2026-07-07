/**
 * One-off: align gateway.auth.token in each project's openclaw.json with OPENCLAW_GATEWAY_TOKEN.
 * Usage (from repo root): node apps/api/scripts/sync-gateway-token-disk.mjs
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { syncGatewayAuthToken } from '../../../packages/workspace-sync/dist/config/sync-helpers.js';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..');
loadEnv({ path: path.join(repoRoot, 'apps/.env') });

const token = process.env.OPENCLAW_GATEWAY_TOKEN?.trim();
if (!token) {
  console.error('OPENCLAW_GATEWAY_TOKEN is not set in apps/.env');
  process.exit(1);
}

const projectsDir = path.join(repoRoot, 'apps/api/data/projects');
const entries = await readdir(projectsDir, { withFileTypes: true });

for (const entry of entries) {
  if (!entry.isDirectory()) continue;
  const configPath = path.join(projectsDir, entry.name, 'openclaw.json');
  let raw;
  try {
    raw = await readFile(configPath, 'utf8');
  } catch {
    continue;
  }
  const config = JSON.parse(raw);
  const before = config.gateway?.auth?.token ?? '(none)';
  syncGatewayAuthToken(config, token);
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`${entry.name}: ${before} -> ${config.gateway.auth.token}`);
}
