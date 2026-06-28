const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

const tokenCache = new Map<string, { accessToken: string; expiresAt: number }>();

export async function refreshGoogleAccessToken(secrets: Record<string, string>): Promise<string> {
  const clientId = secrets.client_id?.trim();
  const clientSecret = secrets.client_secret?.trim();
  const refreshToken = secrets.refresh_token?.trim();
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Google OAuth credentials (client_id, client_secret, refresh_token)');
  }

  const cacheKey = `${clientId}:${refreshToken.slice(0, 8)}`;
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.accessToken;
  }

  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const err =
      typeof json.error_description === 'string' ? json.error_description : 'Google token refresh failed';
    throw new Error(err);
  }

  const accessToken = String(json.access_token ?? '');
  if (!accessToken) {
    throw new Error('Google token refresh returned empty access_token');
  }

  const expiresIn = typeof json.expires_in === 'number' ? json.expires_in : 3600;
  tokenCache.set(cacheKey, {
    accessToken,
    expiresAt: Date.now() + expiresIn * 1000,
  });

  return accessToken;
}
