import { AUTH_COOKIES, accessMaxAgeSec, refreshMaxAgeSec } from './auth.constants.js';

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

export function buildClearAuthCookieSpecs(): AuthCookieSpec[] {
  const base = baseCookieOptions();
  return [
    {
      name: AUTH_COOKIES.ACCESS,
      value: '',
      options: { ...base, path: '/', maxAge: 0 },
    },
    {
      name: AUTH_COOKIES.REFRESH,
      value: '',
      options: { ...base, path: '/', maxAge: 0 },
    },
  ];
}
