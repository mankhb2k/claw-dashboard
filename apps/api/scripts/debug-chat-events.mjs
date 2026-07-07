import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openGatewayUpstream } from '@claw-dashboard/control-plane-core';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const hostPort = Number(process.env.CHAT_TEST_PORT ?? 32769);
const wsBaseUrl =
  process.env.CHAT_TEST_WS_URL?.trim() || `ws://127.0.0.1:${hostPort}`;

const ws = await openGatewayUpstream(
  wsBaseUrl,
  process.env.CHAT_TEST_TOKEN?.trim() ||
    'te8j0ETTkiZwofUGwtLoghRg7sZTruET1HsXbj8xHGE',
  process.env.CHAT_TEST_PROJECT_DIR?.trim() ||
    path.join(root, 'data/projects/cmpexhnkt0002csvhv901kggd'),
);

ws.on('message', (raw) => {
  const f = JSON.parse(String(raw));
  if (f.type === 'event' && (f.event === 'chat' || f.event === 'agent')) {
    console.log(f.event, JSON.stringify(f.payload));
  }
});

const id = randomUUID();
ws.send(
  JSON.stringify({
    type: 'req',
    id,
    method: 'chat.send',
    params: {
      sessionKey: 'main',
      message: 'Say pong only',
      deliver: false,
      idempotencyKey: randomUUID(),
    },
  }),
);

setTimeout(() => {
  ws.close();
  process.exit(0);
}, 45_000);
