import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/register']
const AUTH_COOKIE = 'better-auth.session_token'

/** API base (same as axios). Proxy runs on the server/edge; must reach the control-plane API. */
function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
}

/**
 * True only if the session is valid, not just if a cookie is present.
 * Relying on the cookie name alone allows expired/invalid sessions to see protected pages.
 */
async function hasValidSession(request: NextRequest): Promise<boolean> {
  if (!request.cookies.get(AUTH_COOKIE)?.value) {
    return false
  }

  const api = getApiBaseUrl()
  const cookie = request.headers.get('cookie') ?? ''
  if (!cookie) {
    return false
  }

  try {
    const res = await fetch(`${api}/api/auth/get-session`, {
      method: 'GET',
      headers: { cookie, Accept: 'application/json' },
      cache: 'no-store',
    })

    if (!res.ok) {
      return false
    }

    const json: unknown = await res.json()
    if (!json || typeof json !== 'object') {
      return false
    }
    const o = json as Record<string, unknown>
    // Nest ResponseInterceptor: { success, data }
    const payload =
      'success' in o && o.success === true && o.data && typeof o.data === 'object'
        ? (o.data as Record<string, unknown>)
        : o
    return Boolean((payload as { user?: unknown }).user)
  } catch {
    return false
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`))
  const validSession = await hasValidSession(request)

  if (!isPublic && !validSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isPublic && validSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
