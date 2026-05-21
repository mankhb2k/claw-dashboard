import { randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

type PendingRequest = {
  requestId: string;
  deviceId: string;
  publicKey: string;
  displayName?: string;
  platform?: string;
  deviceFamily?: string;
  clientId?: string;
  clientMode?: string;
  role?: string;
  roles?: string[];
  scopes?: string[];
  remoteIp?: string;
  ts: number;
};

type DeviceAuthToken = {
  token: string;
  role: string;
  scopes: string[];
  createdAtMs: number;
};

type PairedDevice = {
  deviceId: string;
  publicKey: string;
  displayName?: string;
  platform?: string;
  deviceFamily?: string;
  clientId?: string;
  clientMode?: string;
  role?: string;
  roles?: string[];
  scopes?: string[];
  approvedScopes?: string[];
  remoteIp?: string;
  tokens?: Record<string, DeviceAuthToken>;
  createdAtMs: number;
  approvedAtMs: number;
};

function pairingToken(): string {
  return randomBytes(32).toString('base64url');
}

async function readJsonMap<T>(filePath: string): Promise<Record<string, T>> {
  try {
    const parsed = JSON.parse(await readFile(filePath, 'utf8')) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    return parsed as Record<string, T>;
  } catch {
    return {};
  }
}

async function writeJsonMap(filePath: string, data: Record<string, unknown>): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
}

function hasOperatorWrite(device: PairedDevice | undefined): boolean {
  const scopes = device?.approvedScopes ?? device?.scopes ?? [];
  return scopes.includes('operator.write') || scopes.includes('operator.admin');
}

/**
 * Self-host SaaS: auto-approve pending pairing for the backend proxy device.
 * Gateway sees Docker bridge IP (172.17.x) so loopback auto-approve does not apply.
 */
export async function approveProxyDeviceIfPending(
  projectDataDir: string,
  deviceId: string,
): Promise<boolean> {
  const devicesDir = path.join(projectDataDir, 'devices');
  const pendingPath = path.join(devicesDir, 'pending.json');
  const pairedPath = path.join(devicesDir, 'paired.json');

  const pendingById = await readJsonMap<PendingRequest>(pendingPath);
  const pairedByDeviceId = await readJsonMap<PairedDevice>(pairedPath);

  if (hasOperatorWrite(pairedByDeviceId[deviceId])) {
    return false;
  }

  const pending = Object.values(pendingById).find((p) => p.deviceId === deviceId);
  if (!pending) {
    return false;
  }

  const now = Date.now();
  const role = pending.role ?? 'operator';
  const scopes = pending.scopes ?? ['operator.admin', 'operator.read', 'operator.write'];
  const existing = pairedByDeviceId[deviceId];
  const tokens = existing?.tokens ? { ...existing.tokens } : {};
  tokens[role] = {
    token: pairingToken(),
    role,
    scopes,
    createdAtMs: existing?.tokens?.[role]?.createdAtMs ?? now,
  };

  pairedByDeviceId[deviceId] = {
    deviceId: pending.deviceId,
    publicKey: pending.publicKey,
    displayName: pending.displayName,
    platform: pending.platform,
    deviceFamily: pending.deviceFamily,
    clientId: pending.clientId,
    clientMode: pending.clientMode,
    role: pending.role,
    roles: pending.roles ?? (pending.role ? [pending.role] : ['operator']),
    scopes,
    approvedScopes: scopes,
    remoteIp: pending.remoteIp,
    tokens,
    createdAtMs: existing?.createdAtMs ?? now,
    approvedAtMs: now,
  };

  delete pendingById[pending.requestId];
  await writeJsonMap(pairedPath, pairedByDeviceId as Record<string, unknown>);
  await writeJsonMap(pendingPath, pendingById as Record<string, unknown>);
  return true;
}

export function isPairingRequiredError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('pairing required') || lower.includes('not approved');
}
