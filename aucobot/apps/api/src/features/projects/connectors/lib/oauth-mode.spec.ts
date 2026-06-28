import {
  connectorSlugToRelayProvider,
  getOAuthMode,
  isRelayOAuthEnabled,
} from './oauth-mode';

describe('oauth-mode', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('defaults to local without relay env', () => {
    delete process.env.OAUTH_MODE;
    delete process.env.OAUTH_RELAY_URL;
    delete process.env.OAUTH_RELAY_API_SECRET;
    expect(getOAuthMode()).toBe('local');
    expect(isRelayOAuthEnabled()).toBe(false);
  });

  it('enables relay when mode and secrets set', () => {
    process.env.OAUTH_MODE = 'relay';
    process.env.OAUTH_RELAY_URL = 'http://localhost:3090';
    process.env.OAUTH_RELAY_API_SECRET = 'secret';
    expect(isRelayOAuthEnabled()).toBe(true);
  });

  it('maps connector slugs to relay providers', () => {
    expect(connectorSlugToRelayProvider('google-drive')).toBe('google');
    expect(connectorSlugToRelayProvider('google-calendar')).toBe('google');
    expect(connectorSlugToRelayProvider('github')).toBe('github');
    expect(connectorSlugToRelayProvider('slack')).toBeNull();
  });
});
