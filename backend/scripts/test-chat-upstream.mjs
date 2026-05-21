/**
 * Smoke test: signed gateway upstream connect (same path as chat WebSocket proxy).
 * Usage: npm run build && npm run test:chat-upstream
 * Env: CHAT_TEST_PORT, CHAT_TEST_TOKEN, CHAT_TEST_PROJECT_DIR
 */
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectDir =
  process.env.CHAT_TEST_PROJECT_DIR?.trim() ||
  path.join(root, 'data', 'projects', 'cmpexhnkt0002csvhv901kggd');
const hostPort = Number(process.env.CHAT_TEST_PORT ?? 32768);
const token =
  process.env.CHAT_TEST_TOKEN?.trim() ||
  'te8j0ETTkiZwofUGwtLoghRg7sZTruET1HsXbj8xHGE';

const modPath = path.join(root, 'dist', 'plugins', 'projects', 'chat', 'gateway-upstream.js');
const { openGatewayUpstream } = await import(pathToFileURL(modPath).href);

const started = Date.now();
try {
  const ws = await openGatewayUpstream(hostPort, token, projectDir);
  console.log(`OK upstream connect (${Date.now() - started}ms) readyState=${ws.readyState}`);
  ws.close();
  process.exit(0);
} catch (err) {
  console.error(`FAIL upstream connect (${Date.now() - started}ms):`, err?.message ?? err);
  process.exit(1);
}
