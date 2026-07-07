import { getServerApiBaseUrl } from '@/lib/http/api-base-url'

import type { NextRequest, NextResponse } from 'next/server'


export type SessionResolveResult = {
  valid: boolean
  setCookies: string[]
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

function readSetCookies(res: Response): string[] {
  const headers = res.headers as Headers & { getSetCookie?: () => string[] }
  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie()
  }
  const raw = res.headers.get('set-cookie')
  return raw ? [raw] : []
}

async function resolveSessionFromBackend(
  cookieHeader: string,
): Promise<SessionResolveResult> {
  try {
    const res = await fetch(`${getServerApiBaseUrl()}/api/auth/session`, {
      method: 'GET',
      headers: { cookie: cookieHeader, Accept: 'application/json' },
      cache: 'no-store',
    })
    const setCookies = readSetCookies(res)
    if (!res.ok) {
      return { valid: false, setCookies }
    }
    const json: unknown = await res.json()
    return { valid: parseSessionUser(json), setCookies }
  } catch {
    return { valid: false, setCookies: [] }
  }
}

/**
 * Gate protected routes via GET /api/auth/session (silent refresh when access expired).
 * Forwards Set-Cookie from Nest so the browser receives rotated tokens after proxy check.
 */
export async function resolveSession(request: NextRequest): Promise<SessionResolveResult> {
  const cookieHeader = request.headers.get('cookie') ?? ''
  if (!cookieHeader) {
    return { valid: false, setCookies: [] }
  }

  return resolveSessionFromBackend(cookieHeader)
}

/** Append Nest Set-Cookie headers onto a Next response (F5 / navigation after silent refresh). */
export function applySetCookies(response: NextResponse, cookies: string[]): NextResponse {
  for (const cookie of cookies) {
    response.headers.append('Set-Cookie', cookie)
  }
  return response
}
