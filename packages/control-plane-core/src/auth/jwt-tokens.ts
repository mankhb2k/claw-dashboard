/** Sign / verify access JWT (login + guards) */
import jwt from 'jsonwebtoken';
import { accessMaxAgeSec } from './auth.constants.js';

/** JWT payload → req.user */
export type JwtAccessPayload = {
  sub: string;
  username: string;
};

/** JWT_SECRET; throws in production if missing */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }
  return secret || 'dev-only-change-me-in-env';
}

/** Issue access JWT (TTL: accessMaxAgeSec) */
export function signAccessToken(userId: string, username: string): string {
  return jwt.sign(
    { sub: userId, username } satisfies JwtAccessPayload,
    getJwtSecret(),
    { expiresIn: accessMaxAgeSec() },
  );
}

/** Verify JWT → { sub, username } | null (legacy `login` field ok) */
export function verifyAccessToken(
  token: string | undefined,
): JwtAccessPayload | null {
  if (!token?.trim()) return null;
  try {
    const payload = jwt.verify(token, getJwtSecret()) as JwtAccessPayload & {
      sub?: string;
      username?: string;
      /** @deprecated legacy JWT field */
      login?: string;
    };
    if (!payload?.sub || typeof payload.sub !== 'string') return null;
    const username =
      typeof payload.username === 'string'
        ? payload.username
        : typeof payload.login === 'string'
          ? payload.login
          : '';
    return { sub: payload.sub, username };
  } catch {
    return null;
  }
}
