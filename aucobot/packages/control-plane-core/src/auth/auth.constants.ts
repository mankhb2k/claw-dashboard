/** Cookie names + TTL from env (JWT_ACCESS_SECONDS, JWT_REFRESH_DAYS) */
import { AUTH_COOKIES } from '@aucobot/shared';

export { AUTH_COOKIES };

/** Access JWT / oc_access maxAge in seconds (default 900) */
export function accessMaxAgeSec(): number {
  const n = Number(process.env.JWT_ACCESS_SECONDS ?? 900);
  return Number.isFinite(n) && n > 0 ? n : 900;
}

/** Refresh cookie / DB row lifetime in seconds (default 15 days) */
export function refreshMaxAgeSec(): number {
  const days = Number(process.env.JWT_REFRESH_DAYS ?? 15);
  const d = Number.isFinite(days) && days > 0 ? days : 15;
  return d * 86400; // days → seconds
}

/** expiresAt for new refresh_tokens row */
export function refreshExpiresAt(): Date {
  return new Date(Date.now() + refreshMaxAgeSec() * 1000);
}
