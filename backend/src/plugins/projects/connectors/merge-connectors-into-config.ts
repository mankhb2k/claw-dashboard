import path from 'node:path';
import type { ConnectorDefinition } from './connector-registry';
import {
  buildMcpServerEntry,
  writeGoogleDriveCredentialFiles,
  type ConnectorSecretMap,
} from './connector-sync-files';

export type ConnectorMergeRow = {
  connectorSlug: string;
  enabled: boolean;
  connectionStatus: string;
  mcpServerId: string;
  secrets: ConnectorSecretMap;
};

const MANAGED_MCP_IDS = new Set(['google-drive', 'google-calendar']);

/** Merge MCP servers cho connectors đã CONNECTED + enabled. */
export async function mergeConnectorsIntoConfig(
  config: Record<string, unknown>,
  rows: ConnectorMergeRow[],
  dataDir: string,
  resolveDef: (slug: string) => ConnectorDefinition | undefined,
): Promise<Record<string, unknown>> {
  const existingMcp = (config.mcp as Record<string, unknown> | undefined) ?? {};
  const existingServers = (existingMcp.servers as Record<string, unknown> | undefined) ?? {};
  const servers: Record<string, unknown> = {};

  for (const [id, entry] of Object.entries(existingServers)) {
    if (!MANAGED_MCP_IDS.has(id)) {
      servers[id] = entry;
    }
  }

  const active = rows.filter(
    (r) =>
      r.enabled &&
      String(r.connectionStatus).toUpperCase() === 'CONNECTED' &&
      r.secrets.refresh_token,
  );

  for (const row of active) {
    const def = resolveDef(row.connectorSlug);
    if (!def) continue;

    let containerPaths: { oauthPath?: string; credentialsPath?: string } = {};
    if (def.slug === 'google-drive') {
      const host = await writeGoogleDriveCredentialFiles(dataDir, row.secrets);
      containerPaths = {
        oauthPath: path.posix.join(
          '/home/node/.openclaw',
          'connectors',
          'google-drive',
          'gcp-oauth.keys.json',
        ),
        credentialsPath: path.posix.join(
          '/home/node/.openclaw',
          'connectors',
          'google-drive',
          'credentials.json',
        ),
      };
      void host;
    }

    try {
      servers[def.mcpServerId] = buildMcpServerEntry(def, row.secrets, containerPaths);
    } catch {
      // skip invalid row
    }
  }

  if (Object.keys(servers).length > 0) {
    config.mcp = { ...existingMcp, servers };
  } else if (existingMcp.servers) {
    const rest = { ...existingMcp };
    delete (rest as { servers?: unknown }).servers;
    if (Object.keys(rest).length > 0) {
      config.mcp = rest;
    } else {
      delete config.mcp;
    }
  }

  return config;
}
