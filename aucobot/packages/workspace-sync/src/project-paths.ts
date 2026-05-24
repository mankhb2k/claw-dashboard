import { chown, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';

const GATEWAY_RUNTIME_UID = Number(process.env.OPENCLAW_RUNTIME_UID ?? 1000) || 1000;
const GATEWAY_RUNTIME_GID = Number(process.env.OPENCLAW_RUNTIME_GID ?? 1000) || 1000;

const PROJECT_SUBDIRS = ['workspace', 'devices', 'agents', 'logs'] as const;

export function resolveProjectDataDir(
  projectId: string,
  options?: { dataRoot?: string; cwd?: string },
): string {
  const root =
    options?.dataRoot?.trim() ||
    path.join(options?.cwd ?? process.cwd(), 'data', 'projects');
  return path.resolve(root, projectId);
}

async function safeChown(targetPath: string, uid: number, gid: number): Promise<void> {
  try {
    await chown(targetPath, uid, gid);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException | undefined)?.code;
    if (code === 'ENOENT' || code === 'ENOTDIR') return;
    throw err;
  }
}

/** Chown project runtime dirs only — skip plugin-skills / telegram spool (race-prone). */
async function chownRecursive(targetPath: string, uid: number, gid: number, depth = 0): Promise<void> {
  await safeChown(targetPath, uid, gid);
  if (depth >= 4) return;
  let entries;
  try {
    entries = await readdir(targetPath, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const child = path.join(targetPath, String(entry.name));
    if (entry.isDirectory()) {
      await chownRecursive(child, uid, gid, depth + 1);
    } else {
      await safeChown(child, uid, gid);
    }
  }
}

/**
 * Gateway runs as non-root (uid 1000) while the API container often runs as root.
 * Project dirs created by the API must be writable by the gateway for device pairing,
 * agent sessions, and logs.
 */
export async function ensureGatewayWritableProjectDir(dataDir: string): Promise<void> {
  if (typeof process.getuid !== 'function' || process.getuid() !== 0) {
    return;
  }
  const { uid, gid } = { uid: GATEWAY_RUNTIME_UID, gid: GATEWAY_RUNTIME_GID };
  await safeChown(dataDir, uid, gid);
  for (const subdir of PROJECT_SUBDIRS) {
    await chownRecursive(path.join(dataDir, subdir), uid, gid, 0);
  }
  await safeChown(path.join(dataDir, 'openclaw.json'), uid, gid);
  await safeChown(path.join(dataDir, 'proxy-device.json'), uid, gid);
  const devicesDir = path.join(dataDir, 'devices');
  await chownRecursive(devicesDir, uid, gid, 0);
}

export async function ensureProjectLayout(
  projectId: string,
  options?: { dataRoot?: string; cwd?: string },
): Promise<string> {
  const dataDir = resolveProjectDataDir(projectId, options);
  await mkdir(dataDir, { recursive: true });
  for (const subdir of PROJECT_SUBDIRS) {
    await mkdir(path.join(dataDir, subdir), { recursive: true });
  }
  try {
    await ensureGatewayWritableProjectDir(dataDir);
  } catch {
    /* Best-effort — do not block chat/API if ownership sync races with gateway writes. */
  }
  return dataDir;
}

export function openClawConfigPath(dataDir: string): string {
  return path.join(dataDir, 'openclaw.json');
}
