import { readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { AgentFormInput } from '../agents/agent-form.types';
import { compileOpenClawAgentConfig } from '../agents/agent-workspace-compile';
import { PROVIDER_REGISTRY } from '../providers/provider-registry';
import { CONTAINER_STATE_DIR, CONTAINER_WORKSPACE_DIR } from './openclaw-config';

const PROVIDER_ENV_KEYS = new Set(PROVIDER_REGISTRY.map((p) => p.envKey));

export type ProviderKeyRow = {
  envKey: string;
  ciphertext: string;
  defaultModel: string | null;
  updatedAt: Date;
  enabled: boolean;
};

export async function readOpenClawConfigJson(
  configPath: string,
): Promise<Record<string, unknown> | null> {
  try {
    return JSON.parse(await readFile(configPath, 'utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Merge provider API keys + default model vào openclaw.json (gateway watch → reload). */
export function mergeProviderKeysIntoConfig(
  config: Record<string, unknown>,
  rows: ProviderKeyRow[],
  decrypt: (ciphertext: string) => string,
): Record<string, unknown> {
  const enabled = rows.filter((r) => r.enabled);
  const existingEnv = (config.env as Record<string, string> | undefined) ?? {};
  const env: Record<string, string> = {};

  for (const [key, value] of Object.entries(existingEnv)) {
    if (!PROVIDER_ENV_KEYS.has(key)) {
      env[key] = value;
    }
  }

  for (const row of enabled) {
    env[row.envKey] = decrypt(row.ciphertext).replace(/\n/g, '');
  }

  config.env = env;

  const withModel = enabled
    .filter((r) => r.defaultModel?.trim())
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  const primary = withModel[0]?.defaultModel?.trim();
  if (primary) {
    const agents = (config.agents as Record<string, unknown> | undefined) ?? {};
    const defaults = (agents.defaults as Record<string, unknown> | undefined) ?? {};
    const model = (defaults.model as Record<string, unknown> | undefined) ?? {};
    model.primary = primary;
    defaults.model = model;
    agents.defaults = defaults;
    config.agents = agents;
  }

  return config;
}

export type ProjectAgentMergeRow = {
  slug: string;
  name: string;
  formData: AgentFormInput;
  isDefault: boolean;
};

/** Merge user agents vào `agents.list`; giữ `env` và `agents.defaults.model` từ bước provider. */
export function mergeAgentsIntoConfig(
  config: Record<string, unknown>,
  enabledAgents: ProjectAgentMergeRow[],
): Record<string, unknown> {
  const agents = (config.agents as Record<string, unknown> | undefined) ?? {};
  const defaults = (agents.defaults as Record<string, unknown> | undefined) ?? {};
  defaults.workspace = CONTAINER_WORKSPACE_DIR;

  const list: Record<string, unknown>[] = [
    {
      id: 'main',
      name: 'Main',
      workspace: CONTAINER_WORKSPACE_DIR,
    },
  ];

  const sorted = [...enabledAgents].sort((a, b) => {
    if (a.isDefault !== b.isDefault) {
      return a.isDefault ? -1 : 1;
    }
    return a.slug.localeCompare(b.slug);
  });

  for (const row of sorted) {
    const patch = compileOpenClawAgentConfig(row.formData);
    list.push({
      id: row.slug,
      name: row.name.trim() || row.slug,
      workspace: `${CONTAINER_STATE_DIR}/workspace-${row.slug}`,
      model: patch.model,
      sandbox: patch.sandbox,
      exec: patch.exec,
    });
  }

  agents.defaults = defaults;
  agents.list = list;
  config.agents = agents;
  return config;
}

export async function writeOpenClawConfigJson(
  configPath: string,
  config: Record<string, unknown>,
): Promise<void> {
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}

/** Legacy: bỏ .env riêng — OpenClaw đọc `env` trong openclaw.json. */
export async function removeLegacyDotEnv(dataDir: string): Promise<void> {
  try {
    await unlink(path.join(dataDir, '.env'));
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException)?.code !== 'ENOENT') {
      throw err;
    }
  }
}
