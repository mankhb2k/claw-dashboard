import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ConnectorContext, ConnectorSlug } from '../connectors/types.js';
import { createGoogleDriveMcpServer } from '../connectors/google/google-drive.server.js';
import { createGoogleCalendarMcpServer } from '../connectors/google/google-calendar.server.js';
import { refreshGoogleAccessToken } from '../connectors/google/oauth.js';

export function createConnectorMcpServer(
  slug: ConnectorSlug,
  ctx: ConnectorContext,
): McpServer {
  switch (slug) {
    case 'google-drive':
      return createGoogleDriveMcpServer(ctx);
    case 'google-calendar':
      return createGoogleCalendarMcpServer(ctx);
    default: {
      const _exhaustive: never = slug;
      throw new Error(`Unsupported connector: ${_exhaustive}`);
    }
  }
}

export function buildConnectorContext(params: {
  projectId: string;
  connectorSlug: ConnectorSlug;
  secrets: Record<string, string>;
}): ConnectorContext {
  return {
    projectId: params.projectId,
    connectorSlug: params.connectorSlug,
    secrets: params.secrets,
    getAccessToken: () => refreshGoogleAccessToken(params.secrets),
  };
}
