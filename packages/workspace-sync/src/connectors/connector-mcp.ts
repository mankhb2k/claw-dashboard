import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { CONTAINER_STATE_DIR } from '../config/openclaw-config.js';

export type ConnectorSecretMap = Record<string, string>;

export type McpConnectorDef = {
  slug: string;
  mcpServerId: string;
};

/** Write Google Drive MCP credential files into the project volume. */
export async function writeGoogleDriveCredentialFiles(
  dataDir: string,
  secrets: ConnectorSecretMap,
): Promise<{ oauthPath: string; credentialsPath: string }> {
  const clientId = secrets.client_id?.trim();
  const clientSecret = secrets.client_secret?.trim();
  const refreshToken = secrets.refresh_token?.trim();
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing client_id, client_secret, or refresh_token for Google Drive');
  }

  const dir = path.join(dataDir, 'connectors', 'google-drive');
  await mkdir(dir, { recursive: true });

  const oauthPath = path.join(dir, 'gcp-oauth.keys.json');
  const credentialsPath = path.join(dir, 'credentials.json');

  await writeFile(
    oauthPath,
    `${JSON.stringify(
      {
        installed: {
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uris: ['http://localhost'],
        },
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  await writeFile(
    credentialsPath,
    `${JSON.stringify(
      {
        type: 'authorized_user',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  return { oauthPath, credentialsPath };
}

export function buildMcpServerEntry(
  def: McpConnectorDef,
  secrets: ConnectorSecretMap,
  containerPaths: { oauthPath?: string; credentialsPath?: string },
): Record<string, unknown> {
  if (def.slug === 'google-drive') {
    const oauth =
      containerPaths.oauthPath ?? `${CONTAINER_STATE_DIR}/connectors/google-drive/gcp-oauth.keys.json`;
    const creds =
      containerPaths.credentialsPath ??
      `${CONTAINER_STATE_DIR}/connectors/google-drive/credentials.json`;
    return {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-gdrive'],
      env: {
        GDRIVE_OAUTH_PATH: oauth,
        GDRIVE_CREDENTIALS_PATH: creds,
      },
    };
  }

  if (def.slug === 'google-calendar') {
    const clientId = secrets.client_id?.trim();
    const clientSecret = secrets.client_secret?.trim();
    const refreshToken = secrets.refresh_token?.trim();
    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('Missing OAuth credentials for Google Calendar');
    }
    return {
      command: 'npx',
      args: ['-y', '@franciscpd/calendar-mcp-server'],
      env: {
        GOOGLE_CALENDAR_CLIENT_ID: clientId,
        GOOGLE_CALENDAR_CLIENT_SECRET: clientSecret,
        GOOGLE_CALENDAR_REFRESH_TOKEN: refreshToken,
      },
    };
  }

  throw new Error(`Unsupported connector MCP: ${def.slug}`);
}
