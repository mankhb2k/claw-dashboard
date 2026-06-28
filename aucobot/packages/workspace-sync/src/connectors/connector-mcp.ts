import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { CONTAINER_STATE_DIR } from '../config/openclaw-config.js';

export type ConnectorSecretMap = Record<string, string>;

export type McpConnectorDef = {
  slug: string;
  mcpServerId: string;
};

export type RemoteMcpConfig = {
  baseUrl: string;
  signProjectToken: (projectId: string, connectorSlug: string) => string;
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

export function buildRemoteMcpServerEntry(
  remote: RemoteMcpConfig,
  projectId: string,
  def: McpConnectorDef,
): Record<string, unknown> {
  const base = remote.baseUrl.replace(/\/$/, '');
  return {
    url: `${base}/connectors/${def.slug}/mcp`,
    transport: 'streamable-http',
    headers: {
      Authorization: `Bearer ${remote.signProjectToken(projectId, def.slug)}`,
    },
  };
}

export function buildMcpServerEntry(
  def: McpConnectorDef,
  secrets: ConnectorSecretMap,
  containerPaths: { oauthPath?: string; credentialsPath?: string },
  options?: {
    projectId?: string;
    remoteMcp?: RemoteMcpConfig;
  },
): Record<string, unknown> {
  if (options?.remoteMcp && options.projectId) {
    return buildRemoteMcpServerEntry(options.remoteMcp, options.projectId, def);
  }

  if (def.slug === 'google-drive') {
    const oauth =
      containerPaths.oauthPath ?? `${CONTAINER_STATE_DIR}/connectors/google-drive/gcp-oauth.keys.json`;
    const creds =
      containerPaths.credentialsPath ??
      `${CONTAINER_STATE_DIR}/connectors/google-drive/credentials.json`;
    const env = {
      GDRIVE_OAUTH_PATH: oauth,
      GDRIVE_CREDENTIALS_PATH: creds,
    };
    // Pre-baked in gateway image (Dockerfile.gateway). Dev fallback: npx @aucobot/mcp-google-drive
    if (process.env.AUCOBOT_MCP_GOOGLE_DRIVE_USE_NPX === '1') {
      return {
        command: 'npx',
        args: ['-y', '@aucobot/mcp-google-drive'],
        env,
      };
    }
    return {
      command: 'aucobot-mcp-google-drive',
      env,
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
