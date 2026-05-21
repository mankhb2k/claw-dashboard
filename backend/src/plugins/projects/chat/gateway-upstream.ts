import { randomUUID } from 'node:crypto';
import WebSocket from 'ws';
import { buildSignedConnectDevice, OPERATOR_SCOPES } from './gateway-device-auth';
import {
  approveProxyDeviceIfPending,
  isPairingRequiredError,
} from './gateway-device-pairing';
import {
  loadOrCreateGatewayDeviceIdentity,
  type GatewayDeviceIdentity,
} from './gateway-device-identity';

const PROTOCOL_VERSION = 4;
const UPSTREAM_CONNECT_MS = Number(process.env.CHAT_PROXY_UPSTREAM_CONNECT_MS ?? 15_000) || 15_000;

type GatewayFrame = Record<string, unknown>;

function waitOpen(ws: WebSocket, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (ws.readyState === WebSocket.OPEN) {
      resolve();
      return;
    }
    const timer = setTimeout(() => reject(new Error('upstream websocket open timeout')), timeoutMs);
    ws.once('open', () => {
      clearTimeout(timer);
      resolve();
    });
    ws.once('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

function onceFrame(
  ws: WebSocket,
  match: (frame: GatewayFrame) => boolean,
  timeoutMs: number,
): Promise<GatewayFrame> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      ws.off('message', onMessage);
      reject(new Error('upstream websocket frame timeout'));
    }, timeoutMs);

    const onMessage = (data: WebSocket.RawData) => {
      let parsed: GatewayFrame;
      try {
        parsed = JSON.parse(String(data)) as GatewayFrame;
      } catch {
        return;
      }
      if (!match(parsed)) return;
      clearTimeout(timer);
      ws.off('message', onMessage);
      resolve(parsed);
    };
    ws.on('message', onMessage);
  });
}

async function readConnectChallenge(ws: WebSocket): Promise<string> {
  const evt = await onceFrame(
    ws,
    (o) => o.type === 'event' && o.event === 'connect.challenge',
    5_000,
  );
  const nonce = (evt.payload as { nonce?: unknown } | undefined)?.nonce;
  if (typeof nonce === 'string' && nonce.trim()) {
    return nonce.trim();
  }
  throw new Error('gateway connect challenge missing nonce');
}

function assertOperatorWriteScope(helloPayload: Record<string, unknown>): void {
  const auth = helloPayload.auth as { scopes?: unknown } | undefined;
  const scopes = Array.isArray(auth?.scopes)
    ? auth.scopes.filter((s): s is string => typeof s === 'string')
    : [];
  if (scopes.includes('operator.write') || scopes.includes('operator.admin')) {
    return;
  }
  throw new Error(
    `gateway granted insufficient scopes (${scopes.join(', ') || 'none'}); operator.write required`,
  );
}

async function sendConnect(
  ws: WebSocket,
  token: string,
  connectNonce: string,
  identity: GatewayDeviceIdentity,
): Promise<GatewayFrame> {
  const id = randomUUID();
  const responsePromise = onceFrame(
    ws,
    (o) => o.type === 'res' && o.id === id,
    UPSTREAM_CONNECT_MS,
  );

  const device = buildSignedConnectDevice({
    deviceId: identity.deviceId,
    publicKeyPem: identity.publicKeyPem,
    privateKeyPem: identity.privateKeyPem,
    nonce: connectNonce,
    authToken: token,
  });

  ws.send(
    JSON.stringify({
      type: 'req',
      id,
      method: 'connect',
      params: {
        minProtocol: PROTOCOL_VERSION,
        maxProtocol: PROTOCOL_VERSION,
        client: {
          id: 'gateway-client',
          version: 'openclaw-saas-proxy',
          platform: 'node',
          mode: 'backend',
        },
        role: 'operator',
        scopes: [...OPERATOR_SCOPES],
        caps: ['tool-events'],
        auth: { token },
        device,
        userAgent: 'openclaw-saas-proxy',
        locale: 'en',
      },
    }),
  );

  const res = await responsePromise;
  if (!res.ok) {
    const err = res.error as { message?: string; code?: string } | undefined;
    throw new Error(err?.message ?? 'gateway connect failed');
  }
  const payload = res.payload as Record<string, unknown> | undefined;
  if (payload?.type !== 'hello-ok') {
    throw new Error('gateway connect: expected hello-ok');
  }
  assertOperatorWriteScope(payload);
  return res;
}

async function openWs(hostPort: number): Promise<{ ws: WebSocket; connectNonce: string }> {
  const ws = new WebSocket(`ws://127.0.0.1:${hostPort}`);
  await waitOpen(ws, UPSTREAM_CONNECT_MS);
  const connectNonce = await readConnectChallenge(ws);
  return { ws, connectNonce };
}

function closeWs(ws: WebSocket): void {
  try {
    ws.close();
  } catch {
    /* ignore */
  }
}

/** Opens WebSocket to project gateway and completes signed operator connect handshake. */
export async function openGatewayUpstream(
  hostPort: number,
  gatewayToken: string,
  projectDataDir: string,
): Promise<WebSocket> {
  const identity = await loadOrCreateGatewayDeviceIdentity(projectDataDir);
  await approveProxyDeviceIfPending(projectDataDir, identity.deviceId);

  let lastError: Error | undefined;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { ws, connectNonce } = await openWs(hostPort);
    try {
      await sendConnect(ws, gatewayToken, connectNonce, identity);
      return ws;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      closeWs(ws);
      if (attempt === 0 && isPairingRequiredError(lastError.message)) {
        const approved = await approveProxyDeviceIfPending(projectDataDir, identity.deviceId);
        if (approved) {
          continue;
        }
      }
      throw lastError;
    }
  }
  throw lastError ?? new Error('gateway connect failed');
}
