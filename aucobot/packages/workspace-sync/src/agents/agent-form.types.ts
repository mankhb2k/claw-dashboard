export type AgentVibe = 'professional' | 'friendly' | 'strict';
export type AgentInstructionsMode = 'simple' | 'advanced';

export type AgentFormInput = {
  name: string;
  description: string;
  avatar: string;
  tags: string[];
  vibe: AgentVibe;
  instructionsMode: AgentInstructionsMode;
  instructionsRole: string;
  instructionsRules: string;
  instructionsConstraints: string;
  instructionsOutputFormat: string;
  instructionsAdvanced: string;
  toolsNotes: string;
  model: string;
  /** When false → agents.list[].tools.deny includes exec/process */
  shellExecEnabled: boolean;
  /** OpenClaw skill allowlist (`agents.list[].skills`) — SKILL.md frontmatter `name` values. */
  skillNames: string[];
};

export const LEGACY_TEAM_FORM_KEYS = ['teamEnabled', 'allowedAgentSlugs'] as const;
export const LEGACY_EXEC_FORM_KEYS = ['askPolicy', 'safeBins', 'timeoutSec'] as const;
export const LEGACY_SANDBOX_FORM_KEYS = ['sandboxEnabled'] as const;
export const LEGACY_AGENT_SANDBOX_FORM_KEYS = [
  'sandboxPlacement',
  'sandboxMode',
  'sandboxScope',
  'sandboxWorkspaceAccess',
] as const;

export function formDataHasLegacyTeamKeys(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') {
    return false;
  }
  const o = raw as Record<string, unknown>;
  return LEGACY_TEAM_FORM_KEYS.some((key) => key in o);
}

export function formDataHasLegacyExecKeys(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') {
    return false;
  }
  const o = raw as Record<string, unknown>;
  return LEGACY_EXEC_FORM_KEYS.some((key) => key in o);
}

export function formDataHasLegacyAgentSandboxKeys(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') {
    return false;
  }
  const o = raw as Record<string, unknown>;
  return (
    LEGACY_SANDBOX_FORM_KEYS.some((key) => key in o) ||
    LEGACY_AGENT_SANDBOX_FORM_KEYS.some((key) => key in o)
  );
}

/** True when legacy per-agent form opted out of sandbox (migrate to project exempt list). */
export function readLegacySandboxExemptFromRawFormData(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') {
    return false;
  }
  const o = raw as Record<string, unknown>;
  if (o.sandboxPlacement === 'off') {
    return true;
  }
  return false;
}

/** Returns cleaned JSON when legacy keys were present; otherwise null. */
export function stripLegacyTeamKeysFromRawFormData(
  raw: unknown,
): Record<string, unknown> | null {
  if (!formDataHasLegacyTeamKeys(raw)) {
    return null;
  }
  const o = { ...(raw as Record<string, unknown>) };
  for (const key of LEGACY_TEAM_FORM_KEYS) {
    delete o[key];
  }
  return o;
}

/** Strip deprecated per-agent exec fields and legacy sandboxEnabled boolean. */
export function stripLegacyExecKeysFromRawFormData(
  raw: unknown,
): Record<string, unknown> | null {
  if (!formDataHasLegacyExecKeys(raw)) {
    return null;
  }
  const o = { ...(raw as Record<string, unknown>) };
  for (const key of LEGACY_EXEC_FORM_KEYS) {
    delete o[key];
  }
  delete o.sandboxEnabled;
  return o;
}

/** Strip deprecated per-agent sandbox fields (now configured in project Settings). */
export function stripLegacyAgentSandboxKeysFromRawFormData(
  raw: unknown,
): Record<string, unknown> | null {
  if (!formDataHasLegacyAgentSandboxKeys(raw)) {
    return null;
  }
  const o = { ...(raw as Record<string, unknown>) };
  for (const key of LEGACY_SANDBOX_FORM_KEYS) {
    delete o[key];
  }
  for (const key of LEGACY_AGENT_SANDBOX_FORM_KEYS) {
    delete o[key];
  }
  return o;
}

export function parseAgentFormData(raw: unknown): AgentFormInput {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid agent formData');
  }
  const o = raw as Record<string, unknown>;
  return {
    name: String(o.name ?? '').trim(),
    description: String(o.description ?? ''),
    avatar: String(o.avatar ?? '🤖').trim() || '🤖',
    tags: Array.isArray(o.tags) ? o.tags.map((t) => String(t).trim()).filter(Boolean) : [],
    vibe: (['professional', 'friendly', 'strict'].includes(String(o.vibe))
      ? o.vibe
      : 'professional') as AgentVibe,
    instructionsMode: (o.instructionsMode === 'advanced' ? 'advanced' : 'simple') as AgentInstructionsMode,
    instructionsRole: String(o.instructionsRole ?? ''),
    instructionsRules: String(o.instructionsRules ?? ''),
    instructionsConstraints: String(o.instructionsConstraints ?? ''),
    instructionsOutputFormat: String(o.instructionsOutputFormat ?? ''),
    instructionsAdvanced: String(o.instructionsAdvanced ?? ''),
    toolsNotes: String(o.toolsNotes ?? ''),
    model: String(o.model ?? 'claude-3-5-sonnet'),
    shellExecEnabled: o.shellExecEnabled !== false,
    skillNames: Array.isArray(o.skillNames)
      ? o.skillNames.map((t) => String(t).trim()).filter(Boolean)
      : [],
  };
}

/** Persisted JSON — omits legacy per-agent team, exec, and sandbox keys. */
export function toStoredAgentFormData(form: AgentFormInput): Record<string, unknown> {
  return { ...form };
}
