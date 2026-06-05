import { randomUUID } from 'node:crypto';
import { openGatewayUpstream } from '@aucobot/control-plane-core';

const projectDir = process.argv[2];
const sessionKey = process.argv[3];
const token = process.env.CHAT_TEST_TOKEN?.trim() || 'change-me-gateway-token';
const wsUrl = process.env.CHAT_TEST_WS_URL?.trim() || 'ws://127.0.0.1:18789';

const ws = await openGatewayUpstream(wsUrl, token, projectDir);
const id = randomUUID();
const payload = await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('timeout')), 15000);
  ws.on('message', (raw) => {
    const frame = JSON.parse(String(raw));
    if (frame.type === 'res' && frame.id === id) {
      clearTimeout(timer);
      if (frame.ok) resolve(frame.payload);
      else reject(new Error(frame.error?.message ?? 'failed'));
    }
  });
  ws.send(
    JSON.stringify({
      type: 'req',
      id,
      method: 'chat.history',
      params: { sessionKey, limit: 20 },
    }),
  );
});
console.log(JSON.stringify(payload?.messages ?? payload, null, 2));
ws.close();
