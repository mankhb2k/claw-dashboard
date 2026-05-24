/**
 * Browser API base URL.
 * Default: same-origin (`''`) so auth cookies live on the web host (Next `/api` rewrite → Nest).
 * Set `NEXT_PUBLIC_API_URL=http://localhost:3001` only if you intentionally skip the rewrite.
 */
export function getPublicApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL
  if (configured !== undefined && configured.trim() !== '') {
    return configured.replace(/\/$/, '')
  }
  return ''
}

/** Server-side calls (Next middleware, RSC) — use Docker service name in compose. */
export function getServerApiBaseUrl(): string {
  return (
    process.env.API_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:3001'
  )
}
