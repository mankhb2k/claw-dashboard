import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildMcpServerEntry } from './connector-mcp.js';

describe('buildMcpServerEntry', () => {
  it('uses npx for google-drive', () => {
    const entry = buildMcpServerEntry(
      { slug: 'google-drive', mcpServerId: 'google-drive' },
      { refresh_token: 'rt', client_id: 'id', client_secret: 'sec' },
      {
        oauthPath: '/data/oauth.json',
        credentialsPath: '/data/credentials.json',
      },
    );
    assert.equal((entry as { command?: string }).command, 'npx');
    assert.deepEqual((entry as { args?: string[] }).args, [
      '-y',
      '@modelcontextprotocol/server-gdrive',
    ]);
    assert.deepEqual((entry as { env?: Record<string, string> }).env, {
      GDRIVE_OAUTH_PATH: '/data/oauth.json',
      GDRIVE_CREDENTIALS_PATH: '/data/credentials.json',
    });
  });

  it('uses npx for google-calendar', () => {
    const entry = buildMcpServerEntry(
      { slug: 'google-calendar', mcpServerId: 'google-calendar' },
      { refresh_token: 'rt', client_id: 'id', client_secret: 'sec' },
      {},
    );
    assert.equal((entry as { command?: string }).command, 'npx');
  });
});
