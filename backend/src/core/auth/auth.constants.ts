export const AUTH_COOKIES = {
  ACCESS: 'oc_access',
  REFRESH: 'oc_refresh',
} as const;

export function accessMaxAgeSec(): number {
  const n = Number(process.env.JWT_ACCESS_SECONDS ?? 900);
  return Number.isFinite(n) && n > 0 ? n : 900;
}

export function refreshMaxAgeSec(): number {
  const days = Number(process.env.JWT_REFRESH_DAYS ?? 7);
  const d = Number.isFinite(days) && days > 0 ? days : 7;
  return d * 86400;
}
