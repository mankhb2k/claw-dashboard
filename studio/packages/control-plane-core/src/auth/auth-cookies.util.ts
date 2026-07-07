/** Set-Cookie specs for API (login / refresh / logout) */
import { AUTH_COOKIES, accessMaxAgeSec, refreshMaxAgeSec } from './auth.constants.js';

/** Paths cleared on logout (stale browser cookies) */
export const AUTH_COOKIE_CLEAR_PATHS = ['/', '/api', '/api/auth'] as const;

export type AuthCookieOptions = {
  httpOnly: true;
  sameSite: 'lax';
  secure: boolean;
  path: string;
  maxAge: number;
};

export type AuthCookieSpec = {
  name: string;
  value: string;
  options: AuthCookieOptions;
};

function baseCookieOptions(): Pick<AuthCookieOptions, 'httpOnly' | 'sameSite' | 'secure'> {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
  };
}

/** oc_access + oc_refresh after auth */
export function buildAuthCookieSpecs(tokens: {
  accessToken: string;
  refreshToken: string;
}): AuthCookieSpec[] {
  const base = baseCookieOptions();
  return [
    {
      name: AUTH_COOKIES.ACCESS,
      value: tokens.accessToken,
      options: { ...base, path: '/', maxAge: accessMaxAgeSec() },
    },
    {
      name: AUTH_COOKIES.REFRESH,
      value: tokens.refreshToken,
      options: { ...base, path: '/', maxAge: refreshMaxAgeSec() },
    },
  ];
}

/** Expire auth cookies on all AUTH_COOKIE_CLEAR_PATHS */
export function buildClearAuthCookieSpecs(): AuthCookieSpec[] {
  const base = baseCookieOptions();
  const specs: AuthCookieSpec[] = [];
  for (const path of AUTH_COOKIE_CLEAR_PATHS) {
    for (const name of [AUTH_COOKIES.ACCESS, AUTH_COOKIES.REFRESH] as const) {
      specs.push({
        name,
        value: '',
        options: { ...base, path, maxAge: 0 },
      });
    }
  }
  return specs;
}
