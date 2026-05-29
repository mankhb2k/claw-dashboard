import type { NextRequest } from 'next/server'
import { AUTH_COOKIES } from '@aucobot/shared'
import { getServerApiBaseUrl } from '@/lib/api-base-url'

export type SessionResolveResult = {
  valid: boolean
}

function parseSessionUser(json: unknown): boolean {
  if (!json || typeof json !== 'object') return false
  const o = json as Record<string, unknown>
  const payload =
    'success' in o && o.success === true && o.data && typeof o.data === 'object'
      ? (o.data as Record<string, unknown>)
      : o
  return Boolean((payload as { user?: unknown }).user)
}

async function fetchSessionOk(cookieHeader: string): Promise<boolean> {
  try {
    const res = await fetch(`${getServerApiBaseUrl()}/api/auth/session`, {
      method: 'GET',
      headers: { cookie: cookieHeader, Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!res.ok) return false
    const json: unknown = await res.json()
    return parseSessionUser(json)
  } catch {
    return false
  }
}

/**
 * Gate protected routes. Do not call /api/auth/refresh here — rotation would
 * invalidate oc_refresh before the browser receives Set-Cookie (axios refresh on
 * the client handles token rotation once per expiry).
 */
export async function resolveSession(request: NextRequest): Promise<SessionResolveResult> {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const hasRefresh = Boolean(request.cookies.get(AUTH_COOKIES.REFRESH)?.value)

  if (cookieHeader) {
    const valid = await fetchSessionOk(cookieHeader)
    if (valid) return { valid: true }
  }

  if (hasRefresh) return { valid: true }

  return { valid: false }
}

export function hasAccessCookie(request: NextRequest): boolean {
  return Boolean(request.cookies.get(AUTH_COOKIES.ACCESS)?.value)
}
