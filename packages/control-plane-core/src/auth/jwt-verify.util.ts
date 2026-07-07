/** Read access/refresh from request; verify access via jwt-tokens.ts. Issuance: auth.service.ts */
import { AUTH_COOKIES } from './auth.constants.js';
import { verifyAccessToken, type JwtAccessPayload } from './jwt-tokens.js';

export type { JwtAccessPayload as VerifiedJwtUser };

/** Bearer → req.cookies[oc_access] → parse Cookie header */
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

/** Raw Cookie: last oc_refresh wins; else req.cookies[oc_refresh] */
export function extractRefreshTokenFromRequest(req: {
  headers?: { cookie?: string };
  cookies?: Record<string, string | undefined>;
}): string | undefined {
  const rawCookie = req.headers?.cookie;
  if (rawCookie) {
    const pattern = new RegExp(`${AUTH_COOKIES.REFRESH}=([^;]+)`, 'g');
    let last: string | undefined;
    for (const match of rawCookie.matchAll(pattern)) {
      const value = match[1]?.trim();
      if (value) last = decodeURIComponent(value);
    }
    if (last) return last;
  }
  const fromRecord = req.cookies?.[AUTH_COOKIES.REFRESH]?.trim();
  return fromRecord || undefined;
}

/** extract + verifyAccessToken → { sub, username } | null */
export function verifyAccessTokenFromRequest(
  req: Parameters<typeof extractAccessTokenFromRequest>[0],
): JwtAccessPayload | null {
  return verifyAccessToken(extractAccessTokenFromRequest(req));
}
