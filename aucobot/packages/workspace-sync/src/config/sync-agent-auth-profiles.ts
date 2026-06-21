import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { providerIdForEnvKey } from './provider-env-keys.js';
import type { ProviderKeyRow } from './merge-openclaw/merge-openclaw.js';

/** OpenClaw gateway provider id (not SaaS catalog id). */
const SAAS_PROVIDER_TO_OPENCLAW: Record<string, string> = {
  gemini: 'google',
  openai: 'openai',
  anthropic: 'anthropic',
  deepseek: 'deepseek',
  grok: 'xai',
  mistral: 'mistral',
  openrouter: 'openrouter',
  together: 'together',
  'vercel-ai-gateway': 'vercel-ai-gateway',
  kilocode: 'kilocode',
};

export type AuthProfileApiKey = {
  type: 'api_key';
  provider: string;
  key: string;
};

export type AuthProfilesStore = {
  version?: number;
  profiles: Record<string, AuthProfileApiKey | Record<string, unknown>>;
  order?: Record<string, string[]>;
};

export function openClawProviderIdForSaasProvider(providerId: string): string {
  const trimmed = providerId.trim();
  return SAAS_PROVIDER_TO_OPENCLAW[trimmed] ?? trimmed;
}

export function defaultAuthProfileId(openClawProvider: string): string {
  return `${openClawProvider}:default`;
}

export function authProfilesPath(dataDir: string, agentId: string): string {
  return path.join(dataDir, 'agents', agentId, 'agent', 'auth-profiles.json');
}

function isManagedApiKeyProfile(
  profile: Record<string, unknown>,
  managedOpenClawProviders: Set<string>,
): boolean {
  const type = typeof profile.type === 'string' ? profile.type.trim() : '';
  if (type !== 'api_key') return false;
  const provider =
    typeof profile.provider === 'string' ? profile.provider.trim() : '';
  return managedOpenClawProviders.has(provider);
}

/** Build portable static api_key profiles from enabled SaaS provider keys. */
export function buildManagedAuthProfiles(
  rows: ProviderKeyRow[],
  decrypt: (ciphertext: string) => string,
): AuthProfilesStore {
  const profiles: Record<string, AuthProfileApiKey> = {};
  const order: Record<string, string[]> = {};

  for (const row of rows) {
    if (!row.enabled) continue;
    const saasProviderId = row.providerId?.trim() || providerIdForEnvKey(row.envKey);
    const openClawProvider = openClawProviderIdForSaasProvider(saasProviderId);
    const apiKey = decrypt(row.ciphertext).replace(/\n/g, '').trim();
    if (!apiKey) continue;

    const profileId = defaultAuthProfileId(openClawProvider);
    profiles[profileId] = {
      type: 'api_key',
      provider: openClawProvider,
      key: apiKey,
    };
    order[openClawProvider] = [profileId];
  }

  return { version: 1, profiles, order };
}

const ALL_SYNCED_OPENCLAW_PROVIDERS = new Set(Object.values(SAAS_PROVIDER_TO_OPENCLAW));

export function mergeAuthProfilesStore(
  existing: AuthProfilesStore | null,
  managed: AuthProfilesStore,
): AuthProfilesStore {
  const profiles: AuthProfilesStore['profiles'] = {};

  for (const [id, profile] of Object.entries(existing?.profiles ?? {})) {
    if (!profile || typeof profile !== 'object') continue;
    if (
      isManagedApiKeyProfile(
        profile as Record<string, unknown>,
        ALL_SYNCED_OPENCLAW_PROVIDERS,
      )
    ) {
      continue;
    }
    profiles[id] = profile;
  }

  for (const [id, profile] of Object.entries(managed.profiles)) {
    profiles[id] = profile;
  }

  const order: Record<string, string[]> = { ...(existing?.order ?? {}) };
  for (const provider of ALL_SYNCED_OPENCLAW_PROVIDERS) {
    delete order[provider];
  }
  for (const [provider, ids] of Object.entries(managed.order ?? {})) {
    order[provider] = ids;
  }

  return {
    version: 1,
    profiles,
    order,
  };
}

export async function readAuthProfilesStore(
  filePath: string,
): Promise<AuthProfilesStore | null> {
  try {
    return JSON.parse(await readFile(filePath, 'utf8')) as AuthProfilesStore;
  } catch {
    return null;
  }
}

export async function writeAuthProfilesStore(
  filePath: string,
  store: AuthProfilesStore,
): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
}

export function collectAgentIdsFromOpenClawConfig(
  config: Record<string, unknown>,
): string[] {
  const agents = config.agents as Record<string, unknown> | undefined;
  const list = agents?.list;
  const ids = new Set<string>(['main']);
  if (Array.isArray(list)) {
    for (const entry of list) {
      if (!entry || typeof entry !== 'object') continue;
      const id = (entry as Record<string, unknown>).id;
      if (typeof id === 'string' && id.trim()) {
        ids.add(id.trim());
      }
    }
  }
  return [...ids].sort();
}

/** Mirror enabled foundation/proxy API keys into each agent auth store. */
export async function syncAgentAuthProfiles(params: {
  dataDir: string;
  agentIds: string[];
  providerRows: ProviderKeyRow[];
  decrypt: (ciphertext: string) => string;
}): Promise<void> {
  const managed = buildManagedAuthProfiles(params.providerRows, params.decrypt);

  for (const agentId of params.agentIds) {
    const filePath = authProfilesPath(params.dataDir, agentId);
    const existing = await readAuthProfilesStore(filePath);
    const merged = mergeAuthProfilesStore(existing, managed);
    if (
      Object.keys(merged.profiles).length === 0 &&
      !existing
    ) {
      continue;
    }
    await writeAuthProfilesStore(filePath, merged);
  }
}
