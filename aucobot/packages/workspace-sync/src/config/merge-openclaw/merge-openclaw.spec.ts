import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import type { AgentFormInput } from '../../agents/agent-form.types.js';
import type { ProjectCollaborationSettings } from '../../agents/agent-collaboration.js';
import {
  mergeAgentCollaborationToolsIntoConfig,
  mergeAgentsIntoConfig,
  mergeExecToolsIntoConfig,
  mergeProviderKeysIntoConfig,
  mergeSharedSkillsLoadIntoConfig,
  readOpenClawConfigJson,
  removeLegacyDotEnv,
  writeOpenClawConfigJson,
  type ProjectAgentMergeRow,
  type ProviderKeyRow,
} from './merge-openclaw.js';

const NO_COLLABORATION: ProjectCollaborationSettings = {
  enabled: false,
  memberSlugs: [],
};

function minimalForm(overrides: Partial<AgentFormInput> = {}): AgentFormInput {
  return {
    name: 'Researcher',
    description: 'Test agent',
    avatar: '',
    tags: [],
    vibe: 'friendly',
    instructionsMode: 'simple',
    instructionsRole: 'You are helpful.',
    instructionsRules: '',
    instructionsConstraints: '',
    instructionsOutputFormat: '',
    instructionsAdvanced: '',
    toolsNotes: '',
    model: 'openai/gpt-4o',
    shellExecEnabled: true,
    skillNames: ['web-search'],
    ...overrides,
  };
}

function providerRow(overrides: Partial<ProviderKeyRow> = {}): ProviderKeyRow {
  return {
    providerId: 'openai',
    envKey: 'OPENAI_API_KEY',
    ciphertext: 'encrypted-key',
    defaultModel: 'openai/gpt-4o',
    updatedAt: new Date('2024-06-01T00:00:00Z'),
    enabled: true,
    ...overrides,
  };
}

describe('mergeProviderKeysIntoConfig', () => {
  it('merges provider env keys and sets primary model from newest default', () => {
    const config: Record<string, unknown> = {
      env: { CUSTOM_VAR: 'keep', OPENAI_API_KEY: 'stale' },
      plugins: { entries: { google: { enabled: true } } },
    };

    const result = mergeProviderKeysIntoConfig(
      config,
      [
        providerRow({
          defaultModel: 'openai/gpt-4o-mini',
          updatedAt: new Date('2024-01-01T00:00:00Z'),
        }),
        providerRow({
          providerId: 'gemini',
          envKey: 'GEMINI_API_KEY',
          defaultModel: 'google/gemini-2.0',
          updatedAt: new Date('2024-06-02T00:00:00Z'),
        }),
      ],
      (cipher) => `plain-${cipher}`,
    );

    const env = result.env as Record<string, string>;
    assert.equal(env.CUSTOM_VAR, 'keep');
    assert.equal(env.OPENAI_API_KEY, 'plain-encrypted-key');
    assert.equal(env.GEMINI_API_KEY, 'plain-encrypted-key');

    const primary = (
      (result.agents as { defaults: { model: { primary: string } } }).defaults.model.primary
    );
    assert.equal(primary, 'google/gemini-2.0');

    const entries = (result.plugins as { entries: Record<string, { enabled: boolean }> }).entries;
    assert.equal(entries.openai.enabled, true);
  });

  it('adds foundation allowlist models without dropping existing entries', () => {
    const config: Record<string, unknown> = {
      agents: {
        defaults: {
          models: {
            'anthropic/claude-3': {},
          },
        },
      },
    };

    const result = mergeProviderKeysIntoConfig(config, [], () => '', {
      foundationAllowlistOpenclawIds: ['openai/gpt-4o'],
    });

    const models = (
      (result.agents as { defaults: { models: Record<string, Record<string, never>> } }).defaults
        .models
    );
    assert.ok(models['anthropic/claude-3']);
    assert.ok(models['openai/gpt-4o']);
  });
});

describe('mergeSharedSkillsLoadIntoConfig', () => {
  it('adds shared project skills dir to skills.load.extraDirs once', () => {
    const config: Record<string, unknown> = {
      skills: {
        load: {
          extraDirs: ['/custom/skills'],
        },
      },
    };

    const result = mergeSharedSkillsLoadIntoConfig(config);
    const extraDirs = (
      (result.skills as { load: { extraDirs: string[] } }).load.extraDirs
    );

    assert.equal(extraDirs.length, 2);
    assert.match(extraDirs[0], /\/workspace\/skills$/);
    assert.equal(extraDirs[1], '/custom/skills');

    const again = mergeSharedSkillsLoadIntoConfig(structuredClone(result));
    const againDirs = (
      (again.skills as { load: { extraDirs: string[] } }).load.extraDirs
    );
    assert.equal(againDirs.length, 2);
  });
});

describe('mergeExecToolsIntoConfig', () => {
  it('writes exec policy under tools.exec', () => {
    const config: Record<string, unknown> = {};

    const result = mergeExecToolsIntoConfig(config, {
      ask: 'on-miss',
      safeBins: ['git', 'pnpm'],
      timeoutSec: 120,
    });

    assert.deepEqual((result.tools as { exec: unknown }).exec, {
      ask: 'on-miss',
      safeBins: ['git', 'pnpm'],
      timeoutSec: 120,
    });
  });

  it('no-ops when exec policy is undefined', () => {
    const config: Record<string, unknown> = { tools: { exec: { ask: 'always' } } };
    const result = mergeExecToolsIntoConfig(config, undefined);
    assert.deepEqual((result.tools as { exec: unknown }).exec, { ask: 'always' });
  });
});

describe('mergeAgentCollaborationToolsIntoConfig', () => {
  it('builds tools.agentToAgent allow list from collaboration settings', () => {
    const config: Record<string, unknown> = {};

    const result = mergeAgentCollaborationToolsIntoConfig(
      config,
      { enabled: true, memberSlugs: ['researcher', 'writer'] },
      ['researcher', 'writer', 'main'],
    );

    const agentToAgent = (result.tools as { agentToAgent: { enabled: boolean; allow: string[] } })
      .agentToAgent;
    assert.equal(agentToAgent.enabled, true);
    assert.deepEqual(agentToAgent.allow.sort(), ['main', 'researcher', 'writer']);
  });
});

describe('mergeAgentsIntoConfig', () => {
  it('creates main agent plus enabled agents with workspaces and skill allowlists', () => {
    const config: Record<string, unknown> = {};
    const rows: ProjectAgentMergeRow[] = [
      {
        slug: 'researcher',
        name: 'Researcher',
        isDefault: true,
        formData: minimalForm({ skillNames: ['web-search', 'web-search'] }),
      },
    ];

    const result = mergeAgentsIntoConfig(config, rows, NO_COLLABORATION);

    const list = (result.agents as { list: Array<Record<string, unknown>> }).list;
    assert.equal(list.length, 2);
    assert.equal(list[0].id, 'main');
    assert.equal(list[1].id, 'researcher');
    assert.match(String(list[1].workspace), /workspace-researcher$/);
    assert.deepEqual(list[1].skills, ['web-search']);
    assert.ok((result.skills as { load: { extraDirs: string[] } }).load.extraDirs.length >= 1);
  });

  it('denies exec tools when shellExecEnabled is false', () => {
    const config: Record<string, unknown> = {};
    const rows: ProjectAgentMergeRow[] = [
      {
        slug: 'safe-bot',
        name: 'Safe Bot',
        isDefault: false,
        formData: minimalForm({ shellExecEnabled: false }),
      },
    ];

    const result = mergeAgentsIntoConfig(config, rows, NO_COLLABORATION);
    const agent = (result.agents as { list: Array<Record<string, unknown>> }).list[1];
    assert.deepEqual((agent.tools as { deny: string[] }).deny, ['exec', 'process']);
  });
});

describe('openclaw config io helpers', () => {
  it('readOpenClawConfigJson returns null for missing files', async () => {
    const result = await readOpenClawConfigJson(join(tmpdir(), 'missing-openclaw-config.json'));
    assert.equal(result, null);
  });

  it('writeOpenClawConfigJson and readOpenClawConfigJson round-trip', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ws-openclaw-io-'));
    const configPath = join(dir, 'openclaw.json');
    const payload = { gateway: { mode: 'local' }, agents: { defaults: {} } };

    await writeOpenClawConfigJson(configPath, payload);
    const readBack = await readOpenClawConfigJson(configPath);

    assert.deepEqual(readBack, payload);
    const raw = await readFile(configPath, 'utf8');
    assert.match(raw, /\n$/);
  });

  it('removeLegacyDotEnv deletes .env when present', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ws-openclaw-dotenv-'));
    const dotEnvPath = join(dir, '.env');
    await writeFile(dotEnvPath, 'OPENAI_API_KEY=old\n', 'utf8');

    await removeLegacyDotEnv(dir);

    await assert.rejects(() => access(dotEnvPath));
  });
});
