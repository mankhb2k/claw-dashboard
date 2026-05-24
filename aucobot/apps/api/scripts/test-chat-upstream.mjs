/**
 * Smoke test: signed gateway upstream connect (same path as chat WebSocket proxy).
 * Usage: pnpm --filter @aucobot/control-plane-core build && npm run test:chat-upstream
 * Env: CHAT_TEST_WS_URL, CHAT_TEST_PORT, CHAT_TEST_TOKEN, CHAT_TEST_PROJECT_DIR
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openGatewayUpstream } from '@aucobot/control-plane-core';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectDir =
  process.env.CHAT_TEST_PROJECT_DIR?.trim() ||
  path.join(root, 'data', 'projects', 'cmpexhnkt0002csvhv901kggd');
const hostPort = Number(process.env.CHAT_TEST_PORT ?? 32768);
const wsBaseUrl =
  process.env.CHAT_TEST_WS_URL?.trim() || `ws://127.0.0.1:${hostPort}`;
const token =
  process.env.CHAT_TEST_TOKEN?.trim() ||
  'te8j0ETTkiZwofUGwtLoghRg7sZTruET1HsXbj8xHGE';

const started = Date.now();
try {
  const ws = await openGatewayUpstream(wsBaseUrl, token, projectDir);
  console.log(`OK upstream connect (${Date.now() - started}ms) readyState=${ws.readyState}`);
  ws.close();
  process.exit(0);
} catch (err) {
  console.error(`FAIL upstream connect (${Date.now() - started}ms):`, err?.message ?? err);
  process.exit(1);
}
