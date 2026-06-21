export type RuntimeMode = 'oss' | 'cloud'

export function isOssRuntime(): boolean {
  const raw = process.env.NEXT_PUBLIC_RUNTIME_MODE?.trim().toLowerCase()
  return raw === 'oss' || raw !== 'cloud'
}

/** Hosted / multi-tenant UI when NEXT_PUBLIC_RUNTIME_MODE is not `oss`. */
export function isCloudRuntime(): boolean {
  return process.env.NEXT_PUBLIC_RUNTIME_MODE?.trim().toLowerCase() === 'cloud'
}
