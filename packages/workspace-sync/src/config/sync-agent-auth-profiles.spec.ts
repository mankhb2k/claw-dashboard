import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import type { ProviderKeyRow } from './merge-openclaw/merge-openclaw.js';
import {
  authProfilesPath,
  buildManagedAuthProfiles,
  collectAgentIdsFromOpenClawConfig,
  mergeAuthProfilesStore,
  syncAgentAuthProfiles,
} from './sync-agent-auth-profiles.js';

function providerRow(overrides: Partial<ProviderKeyRow> = {}): ProviderKeyRow {
  return {
    providerId: 'deepseek',
    envKey: 'DEEPSEEK_API_KEY',
    ciphertext: 'cipher-deepseek',
    defaultModel: 'deepseek/deepseek-v4-flash',
    updatedAt: new Date('2026-06-15T00:00:00Z'),
    enabled: true,
    ...overrides,
  };
}

describe('sync-agent-auth-profiles', () => {
  it('maps gemini saas id to google openclaw provider', () => {
    const managed = buildManagedAuthProfiles(
      [
        providerRow({
          providerId: 'gemini',
          envKey: 'GEMINI_API_KEY',
          ciphertext: 'cipher-gemini',
        }),
      ],
      (c) => `plain-${c}`,
    );
    assert.equal(managed.profiles['google:default']?.provider, 'google');
    assert.equal(managed.profiles['google:default']?.key, 'plain-cipher-gemini');
  });

  it('merges managed keys without dropping oauth profiles', () => {
    const managed = buildManagedAuthProfiles([providerRow()], () => 'sk-deepseek');
    const merged = mergeAuthProfilesStore(
      {
        version: 1,
        profiles: {
          'openai-codex:default': {
            type: 'oauth',
            provider: 'openai-codex',
            access: 'token',
          },
          'deepseek:legacy': {
            type: 'api_key',
            provider: 'deepseek',
            key: 'old-key',
          },
        },
        order: { 'openai-codex': ['openai-codex:default'] },
      },
      managed,
    );
    assert.equal(
      (merged.profiles['openai-codex:default'] as { type: string }).type,
      'oauth',
    );
    assert.equal(merged.profiles['deepseek:default']?.key, 'sk-deepseek');
    assert.equal(merged.profiles['deepseek:legacy'], undefined);
    assert.deepEqual(merged.order?.deepseek, ['deepseek:default']);
  });

  it('collects main plus agents.list ids', () => {
    const ids = collectAgentIdsFromOpenClawConfig({
      agents: {
        list: [{ id: 'main' }, { id: 'agent-a' }],
      },
    });
    assert.deepEqual(ids, ['agent-a', 'main']);
  });

  it('writes auth-profiles.json for each agent', async () => {
    const dataDir = await mkdtemp(join(tmpdir(), 'auth-profiles-'));
    await syncAgentAuthProfiles({
      dataDir,
      agentIds: ['main', 'agent-a'],
      providerRows: [providerRow()],
      decrypt: () => 'sk-deepseek-test',
    });

    const mainRaw = await readFile(authProfilesPath(dataDir, 'main'), 'utf8');
    const mainStore = JSON.parse(mainRaw) as {
      profiles: Record<string, { key: string }>;
    };
    assert.equal(mainStore.profiles['deepseek:default']?.key, 'sk-deepseek-test');

    const agentRaw = await readFile(authProfilesPath(dataDir, 'agent-a'), 'utf8');
    const agentStore = JSON.parse(agentRaw) as {
      profiles: Record<string, { key: string }>;
    };
    assert.equal(agentStore.profiles['deepseek:default']?.key, 'sk-deepseek-test');
  });
});
