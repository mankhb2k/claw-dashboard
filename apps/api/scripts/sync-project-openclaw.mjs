/**
 * Re-sync openclaw.json from DB (provider keys, agents, …) for one project.
 * Usage (from apps/api): node scripts/sync-project-openclaw.mjs <projectId>
 */
import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPrismaClient } from '@claw-dashboard/database';
import { decryptSecret } from '@claw-dashboard/control-plane-core';
import {
  mergeProviderKeysIntoConfig,
  openClawConfigPath,
  readOpenClawConfigJson,
  writeOpenClawConfigJson,
} from '@claw-dashboard/workspace-sync';

const projectId = process.argv[2]?.trim();
if (!projectId) {
  console.error('Usage: node scripts/sync-project-openclaw.mjs <projectId>');
  process.exit(1);
}

const apiRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataRoot = process.env.OPENCLAW_DATA_ROOT?.trim() || './data/projects';
const dataDir = path.resolve(apiRoot, dataRoot, projectId);
const configPath = openClawConfigPath(dataDir);

const prisma = createPrismaClient(process.env.DATABASE_URL);
const providerRows = await prisma.projectProviderKey.findMany({ where: { projectId } });

const config = (await readOpenClawConfigJson(configPath)) ?? {};
mergeProviderKeysIntoConfig(config, providerRows, decryptSecret);
await writeOpenClawConfigJson(configPath, config);

console.log(`Synced ${providerRows.length} provider key row(s) → ${configPath}`);
const env = config.env ?? {};
console.log('env keys:', Object.keys(env).join(', ') || '(empty)');
const primary = config.agents?.defaults?.model?.primary;
console.log('agents.defaults.model.primary:', primary ?? '(unset)');

await prisma.$disconnect();
