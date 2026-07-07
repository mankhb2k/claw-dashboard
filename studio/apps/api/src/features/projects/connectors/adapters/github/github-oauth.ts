const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

export function getGitHubOAuthConfig() {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET?.trim();
  const backendUrl = (
    process.env.BACKEND_URL ?? `http://localhost:${process.env.PORT ?? 3001}`
  ).replace(/\/$/, '');
  const redirectUri =
    process.env.GITHUB_OAUTH_REDIRECT_URI?.trim() ??
    `${backendUrl}/api/connectors/oauth/callback`;

  if (!clientId || !clientSecret) {
    return null;
  }

  return { clientId, clientSecret, redirectUri };
}

export function buildGitHubAuthUrl(params: {
  state: string;
  scopes: string[];
}): string {
  const cfg = getGitHubOAuthConfig();
  if (!cfg) {
    throw new Error(
      'GitHub OAuth chưa cấu hình (GITHUB_OAUTH_CLIENT_ID / GITHUB_OAUTH_CLIENT_SECRET)',
    );
  }

  const url = new URL(GITHUB_AUTH_URL);
  url.searchParams.set('client_id', cfg.clientId);
  url.searchParams.set('redirect_uri', cfg.redirectUri);
  url.searchParams.set('scope', params.scopes.join(' '));
  url.searchParams.set('state', params.state);
  return url.toString();
}

export async function exchangeGitHubAuthCode(code: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  scope?: string;
}> {
  const cfg = getGitHubOAuthConfig();
  if (!cfg) {
    throw new Error('GitHub OAuth chưa cấu hình');
  }

  const body = new URLSearchParams({
    code,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    redirect_uri: cfg.redirectUri,
  });

  const res = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
  });

  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok || typeof json.error === 'string') {
    const err =
      typeof json.error_description === 'string'
        ? json.error_description
        : typeof json.error === 'string'
          ? json.error
          : 'Token exchange failed';
    throw new Error(err);
  }

  return {
    accessToken: typeof json.access_token === 'string' ? json.access_token : '',
    scope: typeof json.scope === 'string' ? json.scope : undefined,
  };
}

export async function testGitHubAccessToken(
  accessToken: string,
): Promise<void> {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}`);
  }
}
