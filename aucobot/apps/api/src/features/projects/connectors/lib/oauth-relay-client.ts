export type RelayCompleteResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  client_id: string;
  client_secret: string;
  connector_slug?: string;
};

export function buildRelayOAuthStartUrl(params: {
  provider: 'google' | 'github';
  state: string;
  returnUrl: string;
  connectorSlug: string;
  scopes: string[];
}): string {
  const base = process.env.OAUTH_RELAY_URL!.trim().replace(/\/$/, '');
  const url = new URL(`${base}/oauth/${params.provider}/start`);
  url.searchParams.set('state', params.state);
  url.searchParams.set('return_url', params.returnUrl);
  url.searchParams.set('connector_slug', params.connectorSlug);
  url.searchParams.set('scopes', params.scopes.join(' '));
  return url.toString();
}

export async function exchangeRelayCode(
  relayCode: string,
): Promise<RelayCompleteResponse> {
  const base = process.env.OAUTH_RELAY_URL!.trim().replace(/\/$/, '');
  const secret = process.env.OAUTH_RELAY_API_SECRET!.trim();

  const res = await fetch(`${base}/api/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({ relay_code: relayCode }),
  });

  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const err =
      typeof json.error === 'string'
        ? json.error
        : 'Relay token exchange failed';
    throw new Error(err);
  }

  const accessToken =
    typeof json.access_token === 'string' ? json.access_token : '';
  const clientId = typeof json.client_id === 'string' ? json.client_id : '';
  const clientSecret =
    typeof json.client_secret === 'string' ? json.client_secret : '';

  if (!accessToken || !clientId || !clientSecret) {
    throw new Error('Relay returned incomplete credentials');
  }

  return {
    access_token: accessToken,
    refresh_token:
      typeof json.refresh_token === 'string' ? json.refresh_token : undefined,
    expires_in:
      typeof json.expires_in === 'number' ? json.expires_in : undefined,
    scope: typeof json.scope === 'string' ? json.scope : undefined,
    client_id: clientId,
    client_secret: clientSecret,
    connector_slug:
      typeof json.connector_slug === 'string' ? json.connector_slug : undefined,
  };
}
