import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.CHAT_TEST_PORT ?? 32769);
const { openGatewayUpstream } = await import(
  pathToFileURL(path.join(root, 'dist/plugins/projects/chat/gateway-upstream.js')).href,
);

const ws = await openGatewayUpstream(
  port,
  'te8j0ETTkiZwofUGwtLoghRg7sZTruET1HsXbj8xHGE',
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
