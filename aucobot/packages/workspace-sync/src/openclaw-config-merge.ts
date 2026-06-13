import { readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { AgentFormInput } from './agent-form.types.js';
import {
  compileOpenClawAgentConfig,
  type OpenClawAgentSandbox,
} from './agent-workspace-compile.js';
import {
  buildAgentToAgentAllowListFromCollaboration,
  type ProjectCollaborationSettings,
} from './agent-collaboration.js';
import { PROVIDER_ENV_KEYS, providerIdForEnvKey } from './provider-env-keys.js';
import { CONTAINER_STATE_DIR, CONTAINER_WORKSPACE_DIR } from './openclaw-config.js';

export type ProviderKeyRow = {
  providerId?: string;
  envKey: string;
  ciphertext: string;
  defaultModel: string | null;
  updatedAt: Date;
  enabled: boolean;
};

export type MergeProviderKeysOptions = {
  foundationAllowlistOpenclawIds?: string[];
  proxyModelOpenclawIds?: string[];
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

/** OpenClaw plugin id per SaaS provider (gateway plugins.entries). */
const PLUGIN_ENTRY_BY_PROVIDER: Record<string, string> = {
  gemini: 'google',
  google: 'google',
  openai: 'openai',
};

function mergePluginEntriesFromProviders(
  config: Record<string, unknown>,
  enabledProviderIds: Set<string>,
): void {
  const plugins = (config.plugins as Record<string, unknown> | undefined) ?? {};
  const existingEntries =
    (plugins.entries as Record<string, { enabled?: boolean }> | undefined) ?? {};
  const entries: Record<string, { enabled: boolean }> = {};
  for (const [key, value] of Object.entries(existingEntries)) {
    entries[key] = { enabled: value?.enabled === true };
  }

  for (const [providerId, pluginId] of Object.entries(PLUGIN_ENTRY_BY_PROVIDER)) {
    entries[pluginId] = { enabled: enabledProviderIds.has(providerId) };
  }

  plugins.entries = entries;
  config.plugins = plugins;
}

/** Merge provider API keys + default model into openclaw.json (gateway watch → reload). */
export function mergeProviderKeysIntoConfig(
  config: Record<string, unknown>,
  rows: ProviderKeyRow[],
  decrypt: (ciphertext: string) => string,
  options: MergeProviderKeysOptions = {},
): Record<string, unknown> {
  const enabled = rows.filter((r) => r.enabled);
  const enabledProviderIds = new Set(
    enabled.map((r) => {
      if (r.providerId?.trim()) {
        return r.providerId.trim();
      }
      return providerIdForEnvKey(r.envKey);
    }),
  );

  mergePluginEntriesFromProviders(config, enabledProviderIds);
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

  const allowlistEntries = [
    ...(options.foundationAllowlistOpenclawIds ?? []),
    ...(options.proxyModelOpenclawIds ?? []),
  ]
    .map((id) => id.trim())
    .filter(Boolean);

  if (allowlistEntries.length > 0) {
    const agents = (config.agents as Record<string, unknown> | undefined) ?? {};
    const defaults = (agents.defaults as Record<string, unknown> | undefined) ?? {};
    const existingModels =
      (defaults.models as Record<string, Record<string, never>> | undefined) ?? {};
    const models: Record<string, Record<string, never>> = { ...existingModels };
    for (const openclawId of allowlistEntries) {
      models[openclawId] = models[openclawId] ?? {};
    }
    defaults.models = models;
    agents.defaults = defaults;
    config.agents = agents;
  }

  return config;
}

const SHARED_PROJECT_SKILLS_DIR = `${CONTAINER_WORKSPACE_DIR}/skills`;

/** Ensure per-agent workspaces can load project skills synced under `workspace/skills/`. */
export function mergeSharedSkillsLoadIntoConfig(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const skills = (config.skills as Record<string, unknown> | undefined) ?? {};
  const load = (skills.load as Record<string, unknown> | undefined) ?? {};
  const existing = Array.isArray(load.extraDirs)
    ? load.extraDirs.map((entry) => String(entry).trim()).filter(Boolean)
    : [];
  const extraDirs = existing.includes(SHARED_PROJECT_SKILLS_DIR)
    ? existing
    : [SHARED_PROJECT_SKILLS_DIR, ...existing];
  load.extraDirs = extraDirs;
  skills.load = load;
  config.skills = skills;
  return config;
}

function normalizeAgentSkillAllowlist(formData: AgentFormInput): string[] {
  return Array.from(new Set(formData.skillNames.map((name) => name.trim()).filter(Boolean))).sort(
    (a, b) => a.localeCompare(b),
  );
}

export type ProjectAgentMergeRow = {
  slug: string;
  name: string;
  formData: AgentFormInput;
  isDefault: boolean;
};

/** Merge agent-to-agent policy into `tools.agentToAgent` (project collaboration). */
export function mergeAgentCollaborationToolsIntoConfig(
  config: Record<string, unknown>,
  collaboration: ProjectCollaborationSettings,
  enabledAgentSlugs: string[],
): Record<string, unknown> {
  const tools = (config.tools as Record<string, unknown> | undefined) ?? {};
  tools.agentToAgent = buildAgentToAgentAllowListFromCollaboration(
    collaboration,
    enabledAgentSlugs,
  );
  config.tools = tools;
  return config;
}

export type ProjectExecPolicy = {
  ask: string;
  safeBins: string[];
  timeoutSec: number;
};

/** OpenClaw 2026.5+ — exec policy lives under `tools.exec`, not `agents.list[].exec`. */
export function mergeExecToolsIntoConfig(
  config: Record<string, unknown>,
  exec: ProjectExecPolicy | undefined,
): Record<string, unknown> {
  if (!exec) {
    return config;
  }
  const tools = (config.tools as Record<string, unknown> | undefined) ?? {};
  tools.exec = {
    ask: exec.ask,
    safeBins: exec.safeBins,
    timeoutSec: exec.timeoutSec,
  };
  config.tools = tools;
  return config;
}

function applyAgentShellDeny(entry: Record<string, unknown>, shellExecEnabled: boolean): void {
  if (shellExecEnabled) {
    return;
  }
  const tools = (entry.tools as Record<string, unknown> | undefined) ?? {};
  tools.deny = ['exec', 'process'];
  entry.tools = tools;
}

export type ProjectSandboxPolicy = {
  enabled: boolean;
  mode: 'all' | 'selected';
  exemptSlugs: string[];
  appliedSlugs: string[];
};

const DEFAULT_SANDBOX_BLOCK: OpenClawAgentSandbox = {
  mode: 'all',
  scope: 'agent',
  workspaceAccess: 'none',
};

function normalizeSlugSet(slugs: string[]): Set<string> {
  return new Set(
    slugs.map((slug) => String(slug).trim().toLowerCase()).filter(Boolean),
  );
}

function applyProjectSandboxToEntry(
  entry: Record<string, unknown>,
  slug: string,
  policy: ProjectSandboxPolicy,
  exemptSet: ReadonlySet<string>,
  appliedSet: ReadonlySet<string>,
): void {
  if (!policy.enabled) {
    return;
  }

  if (policy.mode === 'all') {
    if (exemptSet.has(slug)) {
      entry.sandbox = { mode: 'off' };
    }
    return;
  }

  if (appliedSet.has(slug)) {
    entry.sandbox = DEFAULT_SANDBOX_BLOCK;
  } else {
    entry.sandbox = { mode: 'off' };
  }
}

/** Merge user agents into `agents.list`; keep `env` and `agents.defaults.model` from provider step. */
export function mergeAgentsIntoConfig(
  config: Record<string, unknown>,
  enabledAgents: ProjectAgentMergeRow[],
  collaboration: ProjectCollaborationSettings,
  projectSandboxPolicy?: ProjectSandboxPolicy,
  projectExecPolicy?: ProjectExecPolicy,
): Record<string, unknown> {
  const policy: ProjectSandboxPolicy = projectSandboxPolicy ?? {
    enabled: false,
    mode: 'all',
    exemptSlugs: [],
    appliedSlugs: [],
  };
  const exemptSet = normalizeSlugSet(policy.exemptSlugs);
  const appliedSet = normalizeSlugSet(policy.appliedSlugs);
  const agents = (config.agents as Record<string, unknown> | undefined) ?? {};
  const defaults = (agents.defaults as Record<string, unknown> | undefined) ?? {};
  defaults.workspace = CONTAINER_WORKSPACE_DIR;

  if (policy.enabled && policy.mode === 'all') {
    defaults.sandbox = DEFAULT_SANDBOX_BLOCK;
  } else {
    delete defaults.sandbox;
  }

  const mainEntry: Record<string, unknown> = {
    id: 'main',
    name: 'Main',
    workspace: CONTAINER_WORKSPACE_DIR,
  };
  applyProjectSandboxToEntry(mainEntry, 'main', policy, exemptSet, appliedSet);

  const list: Record<string, unknown>[] = [mainEntry];

  const sorted = [...enabledAgents].sort((a, b) => {
    if (a.isDefault !== b.isDefault) {
      return a.isDefault ? -1 : 1;
    }
    return a.slug.localeCompare(b.slug);
  });

  for (const row of sorted) {
    const patch = compileOpenClawAgentConfig(row.formData);
    const entry: Record<string, unknown> = {
      id: row.slug,
      name: row.name.trim() || row.slug,
      workspace: `${CONTAINER_STATE_DIR}/workspace-${row.slug}`,
      model: patch.model,
    };
    applyProjectSandboxToEntry(entry, row.slug, policy, exemptSet, appliedSet);
    entry.skills = normalizeAgentSkillAllowlist(row.formData);
    applyAgentShellDeny(entry, row.formData.shellExecEnabled);
    list.push(entry);
  }

  agents.defaults = defaults;
  agents.list = list;
  config.agents = agents;

  mergeSharedSkillsLoadIntoConfig(config);

  mergeAgentCollaborationToolsIntoConfig(
    config,
    collaboration,
    enabledAgents.map((row) => row.slug),
  );

  mergeExecToolsIntoConfig(config, projectExecPolicy);

  return config;
}

export async function writeOpenClawConfigJson(
  configPath: string,
  config: Record<string, unknown>,
): Promise<void> {
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}

/** Legacy: remove standalone .env — OpenClaw reads `env` in openclaw.json. */
export async function removeLegacyDotEnv(dataDir: string): Promise<void> {
  try {
    await unlink(path.join(dataDir, '.env'));
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException)?.code !== 'ENOENT') {
      throw err;
    }
  }
}
