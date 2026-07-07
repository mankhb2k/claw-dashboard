export type RuntimeMode = 'oss';

export function getRuntimeMode(): RuntimeMode {
  return 'oss';
}

export function isOssRuntime(): boolean {
  return true;
}
