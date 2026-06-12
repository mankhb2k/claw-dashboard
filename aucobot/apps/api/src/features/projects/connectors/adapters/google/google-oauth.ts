const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

export function getGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  const backendUrl = (process.env.BACKEND_URL ?? `http://localhost:${process.env.PORT ?? 3001}`).replace(
    /\/$/,
    '',
  );
  const redirectUri =
    process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim() ?? `${backendUrl}/api/connectors/oauth/callback`;

  if (!clientId || !clientSecret) {
    return null;
  }

  return { clientId, clientSecret, redirectUri };
}

export function buildGoogleAuthUrl(params: {
  state: string;
  scopes: string[];
  prompt?: 'consent' | 'select_account';
}): string {
  const cfg = getGoogleOAuthConfig();
  if (!cfg) {
    throw new Error('Google OAuth chưa cấu hình (GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET)');
  }

  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set('client_id', cfg.clientId);
  url.searchParams.set('redirect_uri', cfg.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', params.scopes.join(' '));
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('include_granted_scopes', 'true');
  url.searchParams.set('state', params.state);
  url.searchParams.set('prompt', params.prompt ?? 'consent');
  return url.toString();
}

export async function exchangeGoogleAuthCode(code: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  scope?: string;
}> {
  const cfg = getGoogleOAuthConfig();
  if (!cfg) {
    throw new Error('Google OAuth chưa cấu hình');
  }

  const body = new URLSearchParams({
    code,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    redirect_uri: cfg.redirectUri,
    grant_type: 'authorization_code',
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const err = typeof json.error_description === 'string' ? json.error_description : 'Token exchange failed';
    throw new Error(err);
  }

  return {
    accessToken: String(json.access_token ?? ''),
    refreshToken: typeof json.refresh_token === 'string' ? json.refresh_token : undefined,
    expiresIn: typeof json.expires_in === 'number' ? json.expires_in : undefined,
    scope: typeof json.scope === 'string' ? json.scope : undefined,
  };
}

export async function refreshGoogleAccessToken(refreshToken: string): Promise<string> {
  const cfg = getGoogleOAuthConfig();
  if (!cfg) {
    throw new Error('Google OAuth chưa cấu hình');
  }

  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    grant_type: 'refresh_token',
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const err = typeof json.error_description === 'string' ? json.error_description : 'Refresh failed';
    throw new Error(err);
  }

  return String(json.access_token ?? '');
}
