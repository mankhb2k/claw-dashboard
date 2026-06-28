import { readFile } from 'node:fs/promises';
import type { GoogleOAuthSecrets } from './types.js';

type AuthorizedUserCredentials = {
  type?: string;
  client_id?: string;
  client_secret?: string;
  refresh_token?: string;
};

/**
 * Load Google OAuth secrets from env paths (OpenClaw / AucoBot sync convention).
 *
 * Required env:
 * - GDRIVE_CREDENTIALS_PATH — authorized_user JSON (refresh_token + client_id/secret)
 *
 * Optional:
 * - GDRIVE_OAUTH_PATH — gcp-oauth.keys.json (client_id/secret fallback)
 */
export async function loadGoogleSecretsFromEnv(): Promise<GoogleOAuthSecrets> {
  const credentialsPath = process.env.GDRIVE_CREDENTIALS_PATH?.trim();
  if (!credentialsPath) {
    throw new Error('GDRIVE_CREDENTIALS_PATH environment variable is required');
  }

  const raw = await readFile(credentialsPath, 'utf8');
  const creds = JSON.parse(raw) as AuthorizedUserCredentials;

  let clientId = creds.client_id?.trim() ?? '';
  let clientSecret = creds.client_secret?.trim() ?? '';
  const refreshToken = creds.refresh_token?.trim() ?? '';

  const oauthPath = process.env.GDRIVE_OAUTH_PATH?.trim();
  if ((!clientId || !clientSecret) && oauthPath) {
    const oauthRaw = await readFile(oauthPath, 'utf8');
    const oauth = JSON.parse(oauthRaw) as {
      installed?: { client_id?: string; client_secret?: string };
      web?: { client_id?: string; client_secret?: string };
    };
    const block = oauth.installed ?? oauth.web;
    clientId = clientId || block?.client_id?.trim() || '';
    clientSecret = clientSecret || block?.client_secret?.trim() || '';
  }

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Missing client_id, client_secret, or refresh_token in Google credential files',
    );
  }

  return {
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  };
}
