/**
 * Re-sync openclaw.json for a project (provider keys → disk).
 * Usage: pnpm build && node scripts/sync-project-runtime.mjs [projectId]
 */
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectId = process.argv[2]?.trim() || 'cmpedzekq0001d4k5op1bk8bi';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const modPath = path.join(root, 'dist', 'features', 'projects', 'workspace', 'workspace.service.js');

process.chdir(root);
process.env.OPENCLAW_DATA_ROOT = process.env.OPENCLAW_DATA_ROOT ?? '../../../backend/data/projects';

const { NestFactory } = await import('@nestjs/core');
const { AppModule } = await import(pathToFileURL(path.join(root, 'dist', 'app.module.js')).href);

const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
try {
  const { WorkspaceService } = await import(pathToFileURL(modPath).href);
  const workspace = app.get(WorkspaceService);
  await workspace.syncProjectRuntime(projectId);
  console.log(`OK synced project ${projectId}`);
} finally {
  await app.close();
}
