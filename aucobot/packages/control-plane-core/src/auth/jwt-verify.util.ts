import { AUTH_COOKIES } from './auth.constants.js';
import { verifyAccessToken, type JwtAccessPayload } from './jwt-tokens.js';

export type { JwtAccessPayload as VerifiedJwtUser };

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

export function verifyAccessTokenFromRequest(
  req: Parameters<typeof extractAccessTokenFromRequest>[0],
): JwtAccessPayload | null {
  return verifyAccessToken(extractAccessTokenFromRequest(req));
}
