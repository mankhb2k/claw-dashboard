/** OSS JWT auth cookie names — shared by API (Nest) and web (Next). */
export const AUTH_COOKIES = {
  ACCESS: 'oc_access',
  REFRESH: 'oc_refresh',
} as const;

export type AuthCookieName = (typeof AUTH_COOKIES)[keyof typeof AUTH_COOKIES];
