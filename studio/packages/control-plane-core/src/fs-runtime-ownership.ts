import { chown } from 'node:fs/promises';

const RUNTIME_UID = Number(process.env.OPENCLAW_RUNTIME_UID ?? 1000) || 1000;
const RUNTIME_GID = Number(process.env.OPENCLAW_RUNTIME_GID ?? 1000) || 1000;

/** When the API runs as root in Docker, secret/state files must be readable by the gateway (uid 1000). */
export async function ensureRuntimeFileOwnership(filePath: string): Promise<void> {
  if (typeof process.getuid !== 'function' || process.getuid() !== 0) {
    return;
  }
  try {
    await chown(filePath, RUNTIME_UID, RUNTIME_GID);
  } catch {
    /* ignore — gateway may still read if same user */
  }
}
