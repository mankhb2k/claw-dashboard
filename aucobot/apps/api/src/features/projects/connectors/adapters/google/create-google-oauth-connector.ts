import {
  buildGoogleAuthUrl,
  exchangeGoogleAuthCode,
  getGoogleOAuthConfig,
  refreshGoogleAccessToken,
} from './google-oauth';

import type { ConnectorAdapter } from '../../lib/connector-adapter.types';

export function createGoogleOAuthConnector(def: {
  id: string;
  slug: string;
  displayName: string;
  description: string;
  oauthScopes: string[];
  mcpServerId: string;
}): ConnectorAdapter {
  return {
    id: def.id,
    slug: def.slug,
    displayName: def.displayName,
    description: def.description,
    kind: 'OAUTH',
    status: 'ACTIVE',
    oauthScopes: def.oauthScopes,
    mcpServerId: def.mcpServerId,
    configSchema: null,
    async testConnection(secrets) {
      const refresh = secrets.refresh_token;
      if (!refresh) {
        return { ok: false, message: 'Chưa có refresh token' };
      }
      try {
        await refreshGoogleAccessToken(refresh);
        return { ok: true, message: 'Kết nối Google OK' };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Test failed';
        return { ok: false, message };
      }
    },
    isOAuthConfigured() {
      return getGoogleOAuthConfig() !== null;
    },
    buildOAuthUrl(params) {
      return buildGoogleAuthUrl({
        state: params.state,
        scopes: def.oauthScopes,
        prompt: params.prompt,
      });
    },
    exchangeOAuthCode: exchangeGoogleAuthCode,
    oauthClientSecrets() {
      const cfg = getGoogleOAuthConfig();
      return cfg
        ? { clientId: cfg.clientId, clientSecret: cfg.clientSecret }
        : null;
    },
  };
}
