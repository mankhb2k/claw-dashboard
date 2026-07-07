export type OAuthMode = 'relay' | 'local';

export function getOAuthMode(): OAuthMode {
  const explicit = process.env.OAUTH_MODE?.trim().toLowerCase();
  if (explicit === 'relay' || explicit === 'local') {
    return explicit;
  }
  if (
    process.env.OAUTH_RELAY_URL?.trim() &&
    process.env.OAUTH_RELAY_API_SECRET?.trim()
  ) {
    return 'relay';
  }
  return 'local';
}

export function isRelayOAuthEnabled(): boolean {
  return (
    getOAuthMode() === 'relay' &&
    Boolean(process.env.OAUTH_RELAY_URL?.trim()) &&
    Boolean(process.env.OAUTH_RELAY_API_SECRET?.trim())
  );
}

export function getOAuthRelayPublicMode(): OAuthMode {
  return getOAuthMode();
}

export type RelayOAuthProvider = 'google' | 'github';

export function connectorSlugToRelayProvider(
  connectorSlug: string,
): RelayOAuthProvider | null {
  const slug = connectorSlug.trim().toLowerCase();
  if (slug === 'google-drive' || slug === 'google-calendar') {
    return 'google';
  }
  if (slug === 'github') {
    return 'github';
  }
  return null;
}

export function getApiOAuthCallbackUrl(): string {
  const backendUrl = (
    process.env.BACKEND_URL ?? `http://localhost:${process.env.PORT ?? 3001}`
  ).replace(/\/$/, '');
  return (
    process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim() ??
    `${backendUrl}/api/connectors/oauth/callback`
  );
}
