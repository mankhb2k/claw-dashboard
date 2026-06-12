import path from 'node:path';

/** Windows Docker Desktop: `D:\foo` → `/d/foo` for bind mounts. */
export function toDockerBindSource(hostPath: string): string {
  const resolved = path.resolve(hostPath);
  if (process.platform !== 'win32') {
    return resolved;
  }
  const normalized = resolved.replace(/\\/g, '/');
  const driveMatch = /^([a-zA-Z]):\/(.*)$/.exec(normalized);
  if (driveMatch) {
    return `/${driveMatch[1].toLowerCase()}/${driveMatch[2]}`;
  }
  return normalized;
}
