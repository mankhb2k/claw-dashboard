import type { FastifyReply } from 'fastify';
import { AUTH_COOKIES, accessMaxAgeSec, refreshMaxAgeSec } from './auth.constants';

function baseCookieOptions() {
  const secure = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
  };
}

export function setAuthCookies(
  reply: FastifyReply,
  tokens: { accessToken: string; refreshToken: string },
): void {
  const base = baseCookieOptions();
  reply.setCookie(AUTH_COOKIES.ACCESS, tokens.accessToken, {
    ...base,
    path: '/',
    maxAge: accessMaxAgeSec(),
  });
  reply.setCookie(AUTH_COOKIES.REFRESH, tokens.refreshToken, {
    ...base,
    path: '/api/auth',
    maxAge: refreshMaxAgeSec(),
  });
}

export function clearAuthCookies(reply: FastifyReply): void {
  const base = baseCookieOptions();
  reply.clearCookie(AUTH_COOKIES.ACCESS, { ...base, path: '/' });
  reply.clearCookie(AUTH_COOKIES.REFRESH, { ...base, path: '/api/auth' });
}
