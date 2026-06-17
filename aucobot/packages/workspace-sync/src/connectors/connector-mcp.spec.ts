import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildMcpServerEntry, buildRemoteMcpServerEntry } from './connector-mcp.js';

describe('buildRemoteMcpServerEntry', () => {
  it('builds streamable-http config', () => {
    const entry = buildRemoteMcpServerEntry(
      {
        baseUrl: 'http://mcp:8388',
        signProjectToken: () => 'signed-token',
      },
      'project-abc',
      { slug: 'google-drive', mcpServerId: 'google-drive' },
    );
    assert.deepEqual(entry, {
      url: 'http://mcp:8388/connectors/google-drive/mcp',
      transport: 'streamable-http',
      headers: { Authorization: 'Bearer signed-token' },
    });
  });
});

describe('buildMcpServerEntry dual mode', () => {
  it('uses remote when remoteMcp provided', () => {
    const entry = buildMcpServerEntry(
      { slug: 'google-calendar', mcpServerId: 'google-calendar' },
      { refresh_token: 'rt', client_id: 'id', client_secret: 'sec' },
      {},
      {
        projectId: 'p1',
        remoteMcp: {
          baseUrl: 'http://localhost:8388',
          signProjectToken: () => 'tok',
        },
      },
    );
    assert.ok('url' in entry);
    assert.equal((entry as { command?: string }).command, undefined);
  });

  it('uses npx when remote not provided', () => {
    const entry = buildMcpServerEntry(
      { slug: 'google-calendar', mcpServerId: 'google-calendar' },
      { refresh_token: 'rt', client_id: 'id', client_secret: 'sec' },
      {},
    );
    assert.equal((entry as { command?: string }).command, 'npx');
  });
});
