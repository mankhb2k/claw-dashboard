import type { NextRequest } from 'next/server'
import { AUTH_COOKIES } from '@aucobot/shared'
import { getServerApiBaseUrl } from '@/lib/api-base-url'

export type SessionResolveResult = {
  valid: boolean
  /** Set-Cookie headers from a successful /api/auth/refresh — forward to the browser. */
  setCookies?: string[]
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

async function refreshTokens(
  cookieHeader: string,
): Promise<{ ok: true; setCookies: string[] } | { ok: false }> {
  try {
    const res = await fetch(`${getServerApiBaseUrl()}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        cookie: cookieHeader,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: '{}',
      cache: 'no-store',
    })
    if (!res.ok) return { ok: false }
    const setCookies =
      typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : []
    return { ok: true, setCookies }
  } catch {
    return { ok: false }
  }
}

/** Validate session; if access expired, attempt refresh when oc_refresh is present. */
export async function resolveSession(request: NextRequest): Promise<SessionResolveResult> {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const hasRefresh = Boolean(request.cookies.get(AUTH_COOKIES.REFRESH)?.value)

  if (cookieHeader) {
    const valid = await fetchSessionOk(cookieHeader)
    if (valid) return { valid: true }
  } else if (!hasRefresh) {
    return { valid: false }
  }

  if (!hasRefresh) {
    return { valid: false }
  }

  const refreshed = await refreshTokens(cookieHeader)
  if (!refreshed.ok) return { valid: false }

  return { valid: true, setCookies: refreshed.setCookies }
}

export function hasAccessCookie(request: NextRequest): boolean {
  return Boolean(request.cookies.get(AUTH_COOKIES.ACCESS)?.value)
}
