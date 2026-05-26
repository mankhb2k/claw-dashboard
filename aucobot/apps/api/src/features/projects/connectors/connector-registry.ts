export type ConnectorKind = 'API' | 'MCP' | 'OAUTH';

export type ConnectorDefinition = {
  id: string;
  slug: string;
  displayName: string;
  description: string;
  kind: ConnectorKind;
  status: 'ACTIVE' | 'DISABLED' | 'DEPRECATED';
  /** Google OAuth scopes for this connector. */
  oauthScopes?: string[];
  /** MCP server id in openclaw.json `mcp.servers`. */
  mcpServerId: string;
  configSchema?: null;
};

export const CONNECTOR_REGISTRY: ConnectorDefinition[] = [
  {
    id: 'google-drive',
    slug: 'google-drive',
    displayName: 'Google Drive',
    description: 'Đọc và tìm kiếm file trên Google Drive qua MCP.',
    kind: 'OAUTH',
    status: 'ACTIVE',
    oauthScopes: ['https://www.googleapis.com/auth/drive.readonly'],
    mcpServerId: 'google-drive',
  },
  {
    id: 'google-calendar',
    slug: 'google-calendar',
    displayName: 'Google Calendar',
    description: 'Xem và quản lý sự kiện lịch Google qua MCP.',
    kind: 'OAUTH',
    status: 'ACTIVE',
    oauthScopes: ['https://www.googleapis.com/auth/calendar'],
    mcpServerId: 'google-calendar',
  },
];

export function resolveConnector(slugOrId: string): ConnectorDefinition | undefined {
  const key = slugOrId.trim().toLowerCase();
  return CONNECTOR_REGISTRY.find((c) => c.slug === key || c.id === key);
}

export function listActiveConnectors(): ConnectorDefinition[] {
  return CONNECTOR_REGISTRY.filter((c) => c.status === 'ACTIVE');
}
