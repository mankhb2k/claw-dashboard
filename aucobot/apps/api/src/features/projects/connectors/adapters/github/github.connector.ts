import {
  buildGitHubAuthUrl,
  exchangeGitHubAuthCode,
  getGitHubOAuthConfig,
  testGitHubAccessToken,
} from './github-oauth';
import { isRelayOAuthEnabled } from '../../lib/oauth-mode';

import type { ConnectorAdapter } from '../../lib/connector-adapter.types';

export const GITHUB_CONNECTOR: ConnectorAdapter = {
  id: 'github',
  slug: 'github',
  displayName: 'GitHub',
  description:
    'Kết nối GitHub qua OAuth. GitHub OAuth App không trả refresh_token — lưu access_token.',
  kind: 'OAUTH',
  status: 'ACTIVE',
  oauthScopes: ['read:user', 'repo'],
  mcpServerId: 'github',
  configSchema: null,
  async testConnection(secrets) {
    const token = secrets.access_token?.trim();
    if (!token) {
      return { ok: false, message: 'Chưa có access token' };
    }
    try {
      await testGitHubAccessToken(token);
      return { ok: true, message: 'Kết nối GitHub OK' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Test failed';
      return { ok: false, message };
    }
  },
  isOAuthConfigured() {
    if (isRelayOAuthEnabled()) {
      return true;
    }
    return getGitHubOAuthConfig() !== null;
  },
  buildOAuthUrl(params) {
    return buildGitHubAuthUrl({
      state: params.state,
      scopes: GITHUB_CONNECTOR.oauthScopes ?? [],
    });
  },
  exchangeOAuthCode: exchangeGitHubAuthCode,
  oauthClientSecrets() {
    const cfg = getGitHubOAuthConfig();
    return cfg
      ? { clientId: cfg.clientId, clientSecret: cfg.clientSecret }
      : null;
  },
};
