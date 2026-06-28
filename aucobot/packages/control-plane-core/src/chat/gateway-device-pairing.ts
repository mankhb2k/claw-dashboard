import { randomBytes } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ensureRuntimeFileOwnership } from '../fs-runtime-ownership.js';

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
  await ensureRuntimeFileOwnership(filePath);
}

function hasOperatorWrite(device: PairedDevice | undefined): boolean {
  const scopes = device?.approvedScopes ?? device?.scopes ?? [];
  return scopes.includes('operator.write') || scopes.includes('operator.admin');
}

type DeviceStore = {
  pendingPath: string;
  pairedPath: string;
};

async function listProjectDeviceStores(projectDataDir: string): Promise<DeviceStore[]> {
  const stores: DeviceStore[] = [];
  const ownDevicesDir = path.join(projectDataDir, 'devices');
  stores.push({
    pendingPath: path.join(ownDevicesDir, 'pending.json'),
    pairedPath: path.join(ownDevicesDir, 'paired.json'),
  });

  const projectsRoot = path.dirname(projectDataDir);
  let entries: string[] = [];
  try {
    entries = await readdir(projectsRoot);
  } catch {
    return stores;
  }

  const ownProjectId = path.basename(projectDataDir);
  for (const entry of entries) {
    if (entry === ownProjectId) continue;
    const devicesDir = path.join(projectsRoot, entry, 'devices');
    stores.push({
      pendingPath: path.join(devicesDir, 'pending.json'),
      pairedPath: path.join(devicesDir, 'paired.json'),
    });
  }
  return stores;
}

async function isDeviceApprovedAnywhere(
  projectDataDir: string,
  deviceId: string,
): Promise<boolean> {
  for (const store of await listProjectDeviceStores(projectDataDir)) {
    const pairedByDeviceId = await readJsonMap<PairedDevice>(store.pairedPath);
    if (hasOperatorWrite(pairedByDeviceId[deviceId])) {
      return true;
    }
  }
  return false;
}

async function findPendingForDevice(
  projectDataDir: string,
  deviceId: string,
): Promise<{
  store: DeviceStore;
  pending: PendingRequest;
  pendingById: Record<string, PendingRequest>;
} | null> {
  for (const store of await listProjectDeviceStores(projectDataDir)) {
    const pendingById = await readJsonMap<PendingRequest>(store.pendingPath);
    const pending = Object.values(pendingById).find((p) => p.deviceId === deviceId);
    if (pending) {
      return { store, pending, pendingById };
    }
  }
  return null;
}

/**
 * Self-host SaaS: auto-approve pending pairing for the backend proxy device.
 * Gateway sees Docker bridge IP (172.17.x) so loopback auto-approve does not apply.
 * OSS shared gateway may bind a different project folder than the chat project —
 * scan sibling project dirs under OPENCLAW_DATA_ROOT for pending.json.
 */
export async function approveProxyDeviceIfPending(
  projectDataDir: string,
  deviceId: string,
): Promise<boolean> {
  if (await isDeviceApprovedAnywhere(projectDataDir, deviceId)) {
    return false;
  }

  const resolved = await findPendingForDevice(projectDataDir, deviceId);
  if (!resolved) {
    return false;
  }

  const { store, pending, pendingById } = resolved;
  const pairedByDeviceId = await readJsonMap<PairedDevice>(store.pairedPath);

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
  await writeJsonMap(store.pairedPath, pairedByDeviceId as Record<string, unknown>);
  await writeJsonMap(store.pendingPath, pendingById as Record<string, unknown>);
  return true;
}

export function isPairingRequiredError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('pairing required') || lower.includes('not approved');
}
