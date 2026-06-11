/**
 * Browser API base URL.
 * Default: same-origin (`''`) so auth cookies live on the web host (Next `/api` rewrite → Nest).
 * Set `NEXT_PUBLIC_API_URL=http://localhost:3001` only if you intentionally skip the rewrite.
 */
export function getPublicApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL
  if (configured !== undefined && configured.trim() !== '') {
    const normalized = configured.replace(/\/$/, '')

    // In browser dev, avoid cross-origin localhost API URL (different port),
    // because auth cookies then belong to API origin and Next middleware cannot read them.
    // Falling back to same-origin keeps cookie-based refresh/session stable via Next rewrite.
    if (typeof window !== 'undefined') {
      try {
        const apiUrl = new URL(normalized, window.location.origin)
        const pageUrl = new URL(window.location.origin)
        const localhostHosts = new Set(['localhost', '127.0.0.1'])
        const bothLocalhost =
          localhostHosts.has(apiUrl.hostname) && localhostHosts.has(pageUrl.hostname)
        const sameOrigin = apiUrl.origin === pageUrl.origin
        if (bothLocalhost && !sameOrigin) {
          return ''
        }
      } catch {
        // Keep configured URL if parsing fails.
      }
    }

    return normalized
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
