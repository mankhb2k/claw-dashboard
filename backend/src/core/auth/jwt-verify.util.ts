import { JwtService } from '@nestjs/jwt';
import { AUTH_COOKIES } from './auth.constants';

export type VerifiedJwtUser = { sub: string; login?: string; email?: string };

export function extractAccessTokenFromRequest(req: {
  headers?: { authorization?: string; cookie?: string };
  cookies?: Record<string, string | undefined>;
}): string | undefined {
  const header = req.headers?.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice(7);
  }
  const cookies = req.cookies;
  if (cookies && typeof cookies === 'object') {
    const fromRecord = cookies[AUTH_COOKIES.ACCESS];
    if (fromRecord) return fromRecord;
  }
  const rawCookie = req.headers?.cookie;
  if (rawCookie) {
    const match = rawCookie.match(new RegExp(`${AUTH_COOKIES.ACCESS}=([^;]+)`));
    if (match?.[1]) {
      return decodeURIComponent(match[1].trim());
    }
  }
  return undefined;
}

export function verifyAccessToken(
  jwt: JwtService,
  token: string | undefined,
): VerifiedJwtUser | null {
  if (!token?.trim()) return null;
  try {
    const payload = jwt.verify<{ sub: string; login?: string; email?: string }>(token);
    if (!payload?.sub) return null;
    return payload;
  } catch {
    return null;
  }
}
