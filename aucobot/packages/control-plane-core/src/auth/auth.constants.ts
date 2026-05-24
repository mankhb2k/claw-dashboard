import { AUTH_COOKIES } from '@aucobot/shared';

export { AUTH_COOKIES };

export function accessMaxAgeSec(): number {
  const n = Number(process.env.JWT_ACCESS_SECONDS ?? 900);
  return Number.isFinite(n) && n > 0 ? n : 900;
}

export function refreshMaxAgeSec(): number {
  const days = Number(process.env.JWT_REFRESH_DAYS ?? 7);
  const d = Number.isFinite(days) && days > 0 ? days : 7;
  return d * 86400;
}

export function refreshExpiresAt(): Date {
  return new Date(Date.now() + refreshMaxAgeSec() * 1000);
}
