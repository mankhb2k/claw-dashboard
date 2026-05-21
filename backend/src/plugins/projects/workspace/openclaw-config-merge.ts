import { readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PROVIDER_REGISTRY } from '../providers/provider-registry';

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
