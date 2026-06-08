/**
 * E2E smoke: connect upstream + chat.send + wait for assistant reply.
 * Usage: pnpm --filter @aucobot/control-plane-core build && npm run test:chat-send
 * Env: CHAT_TEST_WS_URL, CHAT_TEST_PORT, CHAT_TEST_TOKEN, CHAT_TEST_PROJECT_DIR
 * Optional: CHAT_TEST_ATTACH=1 — send a tiny PNG via attachments[] (gateway base64 path)
 * Optional: CHAT_TEST_ATTACH_PDF=1 — send a minimal PDF via attachments[]
 */
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openGatewayUpstream } from '@aucobot/control-plane-core';

/** 1×1 red PNG */
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

/** Minimal valid PDF (~minimal structure) */
const TINY_PDF_BASE64 =
  'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvTWVkaWFCb3ggWzAgMCA2NCA2NF0+PgplbmRvYmoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAp0cmFpbGVyCjw8L1NpemUgNC9Sb290IDEgMCBSL0luZm8gNCAwIFI+PgpzdGFydHhyZWYKMTk0CiUlRU9G';

const withAttach = process.env.CHAT_TEST_ATTACH === '1';
const withPdf = process.env.CHAT_TEST_ATTACH_PDF === '1';

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
const sessionKey = process.env.CHAT_TEST_SESSION?.trim() || 'agent:main:main';
const userMessage =
  process.env.CHAT_TEST_MESSAGE?.trim() ||
  'Reply with exactly one word: pong';
const timeoutMs = Number(process.env.CHAT_TEST_TIMEOUT_MS ?? 120_000) || 120_000;

function extractText(message) {
  if (!message || typeof message !== 'object') return null;
  if (typeof message.text === 'string' && message.text.trim()) return message.text;
  const content = message.content;
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return null;
  const parts = [];
  for (const block of content) {
    if (block?.type === 'text' && typeof block.text === 'string') parts.push(block.text);
  }
  return parts.length ? parts.join('\n') : null;
}

function request(ws, method, params) {
  const id = randomUUID();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      ws.off('message', onMessage);
      reject(new Error(`RPC timeout: ${method}`));
    }, timeoutMs);

    const onMessage = (raw) => {
      let frame;
      try {
        frame = JSON.parse(String(raw));
      } catch {
        return;
      }
      if (frame.type === 'res' && frame.id === id) {
        clearTimeout(timer);
        ws.off('message', onMessage);
        if (frame.ok) resolve(frame.payload);
        else reject(new Error(frame.error?.message ?? `${method} failed`));
      }
    };
    ws.on('message', onMessage);
    ws.send(JSON.stringify({ type: 'req', id, method, params }));
  });
}

const started = Date.now();
let ws;
try {
  console.log(`Connecting upstream ${wsBaseUrl} …`);
  ws = await openGatewayUpstream(wsBaseUrl, token, projectDir);
  console.log(`Connected (${Date.now() - started}ms)`);

  const history = await request(ws, 'chat.history', { sessionKey, limit: 5 });
  const prior = Array.isArray(history?.messages) ? history.messages.length : 0;
  console.log(`chat.history ok (${prior} messages in session "${sessionKey}")`);

  const runId = randomUUID();
  const attachments = [];
  if (withAttach) {
    attachments.push({
      mimeType: 'image/png',
      fileName: 'spike.png',
      content: TINY_PNG_BASE64,
    });
  }
  if (withPdf) {
    attachments.push({
      mimeType: 'application/pdf',
      fileName: 'spike.pdf',
      content: TINY_PDF_BASE64,
    });
  }

  const sendMessage =
    attachments.length > 0
      ? process.env.CHAT_TEST_MESSAGE?.trim() ||
        'Acknowledge the attachment(s) in one short sentence.'
      : userMessage;

  console.log(
    `Sending: "${sendMessage}"${attachments.length ? ` (+${attachments.length} attachment(s))` : ''}`,
  );
  await request(ws, 'chat.send', {
    sessionKey,
    message: sendMessage,
    deliver: false,
    idempotencyKey: runId,
    ...(attachments.length ? { attachments } : {}),
  });
  console.log('chat.send accepted, waiting for assistant reply…');

  const reply = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      ws.off('message', onMessage);
      reject(
        new Error(
          `No assistant reply before timeout (events: ${seen.slice(-12).join(', ') || 'none'})`,
        ),
      );
    }, timeoutMs);

    let stream = '';
    const seen = [];
    const onMessage = (raw) => {
      let frame;
      try {
        frame = JSON.parse(String(raw));
      } catch {
        return;
      }
      if (frame.type === 'event' && frame.event !== 'tick') {
        const st = frame.payload?.state;
        seen.push(`${frame.event}:${st ?? '-'}`);
      }
      if (frame.type !== 'event' || frame.event !== 'chat') return;
      const payload = frame.payload ?? {};
      const sk = payload.sessionKey;
      if (sk && sk !== sessionKey && !(sessionKey === 'agent:main:main' && sk === 'main')) return;

      if (payload.state === 'delta') {
        const t = extractText(payload.message);
        if (t) stream = t;
        return;
      }
      if (payload.state === 'final') {
        clearTimeout(timer);
        ws.off('message', onMessage);
        const t = extractText(payload.message) ?? stream;
        resolve(t?.trim() || '(empty final)');
        return;
      }
      if (payload.state === 'complete') {
        clearTimeout(timer);
        ws.off('message', onMessage);
        const t = extractText(payload.message) ?? stream;
        resolve(t?.trim() || '(complete, no text)');
        return;
      }
      if (payload.state === 'error') {
        clearTimeout(timer);
        ws.off('message', onMessage);
        const errText = extractText(payload.message) ?? JSON.stringify(payload);
        reject(new Error(`chat event state=error: ${errText}`));
      }
    };
    ws.on('message', onMessage);
  });

  const elapsed = Date.now() - started;
  console.log(`OK assistant reply (${elapsed}ms):`);
  console.log(reply.slice(0, 500) + (reply.length > 500 ? '…' : ''));
  ws.close();
  process.exit(0);
} catch (err) {
  console.error(`FAIL (${Date.now() - started}ms):`, err?.message ?? err);
  try {
    ws?.close();
  } catch {
    /* ignore */
  }
  process.exit(1);
}
