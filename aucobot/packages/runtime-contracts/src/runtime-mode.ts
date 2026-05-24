export type RuntimeMode = 'oss' | 'cloud';

export function getRuntimeMode(): RuntimeMode {
  const raw = process.env.RUNTIME_MODE?.trim().toLowerCase();
  return raw === 'oss' ? 'oss' : 'cloud';
}

export function isOssRuntime(): boolean {
  return getRuntimeMode() === 'oss';
}

export function isCloudRuntime(): boolean {
  return getRuntimeMode() === 'cloud';
}
