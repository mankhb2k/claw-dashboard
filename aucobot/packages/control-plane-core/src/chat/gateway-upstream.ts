import { randomUUID } from 'node:crypto';
import WebSocket from 'ws';
import { buildSignedConnectDevice, OPERATOR_SCOPES } from './gateway-device-auth.js';
import {
  approveProxyDeviceIfPending,
  isPairingRequiredError,
} from './gateway-device-pairing.js';
import {
  loadOrCreateGatewayDeviceIdentity,
  type GatewayDeviceIdentity,
} from './gateway-device-identity.js';

/** Negotiation range: must include the gateway's PROTOCOL_VERSION (openclaw-worker:1.0.2 → v3). */
const GATEWAY_MIN_PROTOCOL = Number(process.env.OPENCLAW_GATEWAY_MIN_PROTOCOL ?? 3) || 3;
const GATEWAY_MAX_PROTOCOL = Number(
  process.env.OPENCLAW_GATEWAY_MAX_PROTOCOL ?? 4,
) || 4;
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
      reject(
        new Error(
          'upstream websocket frame timeout (gateway may lack write access to project data — check OPENCLAW_DATA_ROOT permissions)',
        ),
      );
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
        minProtocol: GATEWAY_MIN_PROTOCOL,
        maxProtocol: GATEWAY_MAX_PROTOCOL,
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

async function openWs(wsBaseUrl: string): Promise<{ ws: WebSocket; connectNonce: string }> {
  const ws = new WebSocket(wsBaseUrl);
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

/** Opens WebSocket to gateway and completes signed operator connect handshake. */
export async function openGatewayUpstream(
  wsBaseUrl: string,
  gatewayToken: string,
  projectDataDir: string,
): Promise<WebSocket> {
  const identity = await loadOrCreateGatewayDeviceIdentity(projectDataDir);
  await approveProxyDeviceIfPending(projectDataDir, identity.deviceId);

  let lastError: Error | undefined;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { ws, connectNonce } = await openWs(wsBaseUrl);
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

const GATEWAY_RPC_TIMEOUT_MS =
  Number(process.env.OPENCLAW_GATEWAY_RPC_TIMEOUT_MS ?? 30_000) || 30_000;

export class GatewayRpcError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'GatewayRpcError';
  }
}

/** One-shot WebSocket RPC (connect → req → res → close). */
export async function callGatewayRpc<T = unknown>(
  wsBaseUrl: string,
  gatewayToken: string,
  projectDataDir: string,
  method: string,
  params?: unknown,
): Promise<T> {
  const ws = await openGatewayUpstream(wsBaseUrl, gatewayToken, projectDataDir);
  const id = randomUUID();
  try {
    const responsePromise = onceFrame(
      ws,
      (o) => o.type === 'res' && o.id === id,
      GATEWAY_RPC_TIMEOUT_MS,
    );
    ws.send(
      JSON.stringify({
        type: 'req',
        id,
        method,
        params: params ?? {},
      }),
    );
    const res = await responsePromise;
    if (!res.ok) {
      const err = res.error as { message?: string; code?: string } | undefined;
      throw new GatewayRpcError(err?.message ?? `${method} failed`, err?.code);
    }
    return res.payload as T;
  } finally {
    closeWs(ws);
  }
}
