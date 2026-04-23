import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/register']
const AUTH_COOKIE = 'better-auth.session_token'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r))
  const hasSession = request.cookies.has(AUTH_COOKIE)

  if (!isPublic && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isPublic && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
