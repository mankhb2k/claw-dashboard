import type { ConnectorKind } from '@aucobot/shared';

export type ConnectorTestResult = {
  ok: boolean;
  message?: string;
};

export type ConnectorOAuthTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  scope?: string;
};

/** Server-side connector plugin contract (registry adapters). Not the REST catalog DTO. */
export type ConnectorAdapter = {
  id: string;
  slug: string;
  displayName: string;
  description: string;
  kind: ConnectorKind;
  status: 'ACTIVE' | 'DISABLED' | 'DEPRECATED';
  oauthScopes?: string[];
  mcpServerId: string;
  configSchema?: null;
  testConnection(secrets: Record<string, string>): Promise<ConnectorTestResult>;
  isOAuthConfigured(): boolean;
  buildOAuthUrl(params: {
    state: string;
    prompt?: 'consent' | 'select_account';
  }): string;
  exchangeOAuthCode(code: string): Promise<ConnectorOAuthTokens>;
  oauthClientSecrets(): { clientId: string; clientSecret: string } | null;
};
