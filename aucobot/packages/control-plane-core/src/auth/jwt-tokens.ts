import jwt from 'jsonwebtoken';
import { accessMaxAgeSec } from './auth.constants.js';

export type JwtAccessPayload = {
  sub: string;
  login: string;
};

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }
  return secret || 'dev-only-change-me-in-env';
}

export function signAccessToken(userId: string, login: string): string {
  return jwt.sign({ sub: userId, login } satisfies JwtAccessPayload, getJwtSecret(), {
    expiresIn: accessMaxAgeSec(),
  });
}

export function verifyAccessToken(token: string | undefined): JwtAccessPayload | null {
  if (!token?.trim()) return null;
  try {
    const payload = jwt.verify(token, getJwtSecret()) as JwtAccessPayload & {
      sub?: string;
      login?: string;
    };
    if (!payload?.sub || typeof payload.sub !== 'string') return null;
    return {
      sub: payload.sub,
      login: typeof payload.login === 'string' ? payload.login : '',
    };
  } catch {
    return null;
  }
}
