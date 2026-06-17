import assert from 'node:assert/strict';
import { access, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import type { ConnectorMergeRow, ConnectorMergeOptions } from './merge-connectors.js';
import { mergeConnectorsIntoConfig } from './merge-connectors.js';

const SECRETS = {
  client_id: 'test-client-id',
  client_secret: 'test-client-secret',
  refresh_token: 'test-refresh-token',
};

function driveRow(overrides: Partial<ConnectorMergeRow> = {}): ConnectorMergeRow {
  return {
    connectorSlug: 'google-drive',
    enabled: true,
    connectionStatus: 'CONNECTED',
    mcpServerId: 'google-drive',
    secrets: SECRETS,
    ...overrides,
  };
}

function calendarRow(overrides: Partial<ConnectorMergeRow> = {}): ConnectorMergeRow {
  return {
    connectorSlug: 'google-calendar',
    enabled: true,
    connectionStatus: 'CONNECTED',
    mcpServerId: 'google-calendar',
    secrets: SECRETS,
    ...overrides,
  };
}

function resolveDef(slug: string) {
  if (slug === 'google-drive') {
    return { slug: 'google-drive', mcpServerId: 'google-drive' };
  }
  if (slug === 'google-calendar') {
    return { slug: 'google-calendar', mcpServerId: 'google-calendar' };
  }
  if (slug === 'unsupported') {
    return { slug: 'unsupported', mcpServerId: 'unsupported' };
  }
  return undefined;
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

describe('mergeConnectorsIntoConfig', () => {
  it('preserves unmanaged MCP servers while replacing managed ones', async () => {
    const config: Record<string, unknown> = {
      mcp: {
        servers: {
          'custom-tool': { command: 'node', args: ['custom.js'] },
          'google-drive': { command: 'npx', args: ['old'] },
        },
      },
    };

    const result = await mergeConnectorsIntoConfig(
      config,
      [calendarRow()],
      '/tmp/unused',
      resolveDef,
    );

    const servers = (result.mcp as { servers: Record<string, unknown> }).servers;
    assert.deepEqual(servers['custom-tool'], { command: 'node', args: ['custom.js'] });
    assert.equal((servers['google-calendar'] as { command?: string }).command, 'npx');
    assert.equal(servers['google-drive'], undefined);
  });

  it('skips rows that are disabled, not CONNECTED, or missing refresh_token', async () => {
    const config: Record<string, unknown> = {};

    const result = await mergeConnectorsIntoConfig(
      config,
      [
        driveRow({ enabled: false }),
        driveRow({ connectionStatus: 'DISCONNECTED' }),
        driveRow({ secrets: { client_id: 'a', client_secret: 'b' } }),
      ],
      '/tmp/unused',
      resolveDef,
    );

    assert.equal(result.mcp, undefined);
  });

  it('uses remote MCP entries and does not write Google Drive credential files', async () => {
    const dataDir = await mkdtemp(join(tmpdir(), 'ws-merge-remote-'));
    const config: Record<string, unknown> = {};
    const options: ConnectorMergeOptions = {
      projectId: 'project-1',
      remoteMcp: {
        baseUrl: 'http://mcp:8388',
        signProjectToken: () => 'signed-jwt',
      },
    };

    const result = await mergeConnectorsIntoConfig(
      config,
      [driveRow()],
      dataDir,
      resolveDef,
      options,
    );

    const entry = (result.mcp as { servers: Record<string, Record<string, unknown>> }).servers[
      'google-drive'
    ];
    assert.equal(entry.url, 'http://mcp:8388/connectors/google-drive/mcp');
    assert.equal(entry.transport, 'streamable-http');
    assert.equal(entry.headers?.Authorization, 'Bearer signed-jwt');
    assert.equal(await pathExists(join(dataDir, 'connectors', 'google-drive')), false);
  });

  it('writes Google Drive credential files in local (npx) mode', async () => {
    const dataDir = await mkdtemp(join(tmpdir(), 'ws-merge-local-'));
    const config: Record<string, unknown> = {};

    await mergeConnectorsIntoConfig(config, [driveRow()], dataDir, resolveDef);

    assert.equal(await pathExists(join(dataDir, 'connectors', 'google-drive', 'gcp-oauth.keys.json')), true);
    assert.equal(await pathExists(join(dataDir, 'connectors', 'google-drive', 'credentials.json')), true);

    const servers = (config.mcp as { servers: Record<string, Record<string, unknown>> }).servers;
    const entry = servers['google-drive'];
    assert.equal(entry.command, 'npx');
    assert.match(String(entry.env?.GDRIVE_OAUTH_PATH), /google-drive\/gcp-oauth\.keys\.json$/);
  });

  it('removes managed MCP servers when no active connectors remain', async () => {
    const config: Record<string, unknown> = {
      mcp: {
        servers: {
          'google-drive': { command: 'npx', args: ['old'] },
          'google-calendar': { url: 'http://old' },
        },
        other: 'keep-me',
      },
    };

    const result = await mergeConnectorsIntoConfig(
      config,
      [driveRow({ enabled: false })],
      '/tmp/unused',
      resolveDef,
    );

    const mcp = result.mcp as Record<string, unknown>;
    assert.equal(mcp.servers, undefined);
    assert.equal(mcp.other, 'keep-me');
  });

  it('deletes mcp entirely when only servers existed and all managed entries are cleared', async () => {
    const config: Record<string, unknown> = {
      mcp: {
        servers: {
          'google-calendar': { command: 'npx' },
        },
      },
    };

    const result = await mergeConnectorsIntoConfig(
      config,
      [],
      '/tmp/unused',
      resolveDef,
    );

    assert.equal(result.mcp, undefined);
  });

  it('skips rows with unknown connector def or unsupported MCP build errors', async () => {
    const config: Record<string, unknown> = {};

    const result = await mergeConnectorsIntoConfig(
      config,
      [
        driveRow({ connectorSlug: 'missing-adapter' }),
        driveRow({ connectorSlug: 'unsupported' }),
        calendarRow(),
      ],
      '/tmp/unused',
      resolveDef,
    );

    const servers = (result.mcp as { servers: Record<string, unknown> }).servers;
    assert.equal(servers['google-drive'], undefined);
    assert.equal(servers['unsupported'], undefined);
    assert.equal((servers['google-calendar'] as { command?: string }).command, 'npx');
  });
});
