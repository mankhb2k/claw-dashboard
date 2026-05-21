import crypto from 'node:crypto';

const OPERATOR_SCOPES = ['operator.admin', 'operator.read', 'operator.write'] as const;

const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

function base64UrlEncode(buf: Buffer): string {
  return buf.toString('base64').replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
}

function normalizeDeviceMetadataForAuth(value?: string | null): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.replace(/[A-Z]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) + 32),
  );
}

/** OpenClaw gateway protocol v3 device-auth payload (pipe-delimited). */
export function buildDeviceAuthPayloadV3(params: {
  deviceId: string;
  clientId: string;
  clientMode: string;
  role: string;
  scopes: readonly string[];
  signedAtMs: number;
  token?: string | null;
  nonce: string;
  platform?: string | null;
  deviceFamily?: string | null;
}): string {
  const scopes = params.scopes.join(',');
  const token = params.token ?? '';
  const platform = normalizeDeviceMetadataForAuth(params.platform);
  const deviceFamily = normalizeDeviceMetadataForAuth(params.deviceFamily);
  return [
    'v3',
    params.deviceId,
    params.clientId,
    params.clientMode,
    params.role,
    scopes,
    String(params.signedAtMs),
    token,
    params.nonce,
    platform,
    deviceFamily,
  ].join('|');
}

export function signDevicePayload(privateKeyPem: string, payload: string): string {
  const key = crypto.createPrivateKey(privateKeyPem);
  const sig = crypto.sign(null, Buffer.from(payload, 'utf8'), key);
  return base64UrlEncode(sig);
}

function derivePublicKeyRaw(publicKeyPem: string): Buffer {
  const key = crypto.createPublicKey(publicKeyPem);
  const spki = key.export({ type: 'spki', format: 'der' }) as Buffer;
  if (
    spki.length === ED25519_SPKI_PREFIX.length + 32 &&
    spki.subarray(0, ED25519_SPKI_PREFIX.length).equals(ED25519_SPKI_PREFIX)
  ) {
    return spki.subarray(ED25519_SPKI_PREFIX.length);
  }
  return spki;
}

export function publicKeyRawBase64UrlFromPem(publicKeyPem: string): string {
  return base64UrlEncode(derivePublicKeyRaw(publicKeyPem));
}

export function buildSignedConnectDevice(params: {
  deviceId: string;
  publicKeyPem: string;
  privateKeyPem: string;
  nonce: string;
  authToken: string;
}): {
  id: string;
  publicKey: string;
  signature: string;
  signedAt: number;
  nonce: string;
} {
  const signedAtMs = Date.now();
  const payload = buildDeviceAuthPayloadV3({
    deviceId: params.deviceId,
    clientId: 'gateway-client',
    clientMode: 'backend',
    role: 'operator',
    scopes: OPERATOR_SCOPES,
    signedAtMs,
    token: params.authToken,
    nonce: params.nonce,
    platform: 'node',
  });
  return {
    id: params.deviceId,
    publicKey: publicKeyRawBase64UrlFromPem(params.publicKeyPem),
    signature: signDevicePayload(params.privateKeyPem, payload),
    signedAt: signedAtMs,
    nonce: params.nonce,
  };
}

export { OPERATOR_SCOPES };
