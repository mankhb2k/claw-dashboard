/**
 * Mirror enabled provider keys into per-agent auth-profiles.json.
 * Usage (from studio root): node apps/api/scripts/sync-agent-auth-profiles.mjs <projectId>
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { createPrismaClient } from '@claw-dashboard/database';
import { decryptSecret } from '@claw-dashboard/control-plane-core';
import {
  authProfilesPath,
  collectAgentIdsFromOpenClawConfig,
  openClawConfigPath,
  readOpenClawConfigJson,
  resolveProjectDataDir,
  syncAgentAuthProfiles,
} from '@claw-dashboard/workspace-sync';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..');
loadEnv({ path: path.join(repoRoot, 'apps/.env') });

const projectId = process.argv[2]?.trim();
if (!projectId) {
  console.error('Usage: node apps/api/scripts/sync-agent-auth-profiles.mjs <projectId>');
  process.exit(1);
}

const apiRoot = path.join(repoRoot, 'apps/api');
const dataRoot = process.env.OPENCLAW_DATA_ROOT?.trim() || './data/projects';
const dataDir = resolveProjectDataDir(projectId, {
  dataRoot: path.isAbsolute(dataRoot)
    ? dataRoot
    : path.join(apiRoot, dataRoot),
});
const configPath = openClawConfigPath(dataDir);

const prisma = createPrismaClient(process.env.DATABASE_URL);
const providerRows = await prisma.projectProviderKey.findMany({
  where: { projectId },
});
const config = (await readOpenClawConfigJson(configPath)) ?? {};
const agentIds = collectAgentIdsFromOpenClawConfig(config);

await syncAgentAuthProfiles({
  dataDir,
  agentIds,
  providerRows: providerRows.map((row) => ({
    providerId: row.providerId,
    envKey: row.envKey,
    ciphertext: row.ciphertext,
    defaultModel: row.defaultModel,
    updatedAt: row.updatedAt,
    enabled: row.enabled,
  })),
  decrypt: decryptSecret,
});

console.log(`Synced auth profiles for ${agentIds.length} agent(s) → ${dataDir}`);
for (const agentId of agentIds) {
  console.log(`  ${authProfilesPath(dataDir, agentId)}`);
}

await prisma.$disconnect();
