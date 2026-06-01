export type AgentVibe = 'professional' | 'friendly' | 'strict';
export type AgentAskPolicy = 'always' | 'on-miss' | 'off';
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
  sandboxEnabled: boolean;
  askPolicy: AgentAskPolicy;
  safeBins: string[];
  timeoutSec: number;
};

export const LEGACY_TEAM_FORM_KEYS = ['teamEnabled', 'allowedAgentSlugs'] as const;

export function formDataHasLegacyTeamKeys(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') {
    return false;
  }
  const o = raw as Record<string, unknown>;
  return LEGACY_TEAM_FORM_KEYS.some((key) => key in o);
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
    sandboxEnabled: Boolean(o.sandboxEnabled),
    askPolicy: (['always', 'on-miss', 'off'].includes(String(o.askPolicy))
      ? o.askPolicy
      : 'on-miss') as AgentAskPolicy,
    safeBins: Array.isArray(o.safeBins)
      ? o.safeBins.map((t) => String(t).trim().toLowerCase()).filter(Boolean)
      : [],
    timeoutSec: typeof o.timeoutSec === 'number' ? o.timeoutSec : 60,
  };
}

/** Persisted JSON — omits legacy per-agent team keys (collaboration is project-level). */
export function toStoredAgentFormData(form: AgentFormInput): Record<string, unknown> {
  const stored: Record<string, unknown> = { ...form };
  for (const key of LEGACY_TEAM_FORM_KEYS) {
    delete stored[key];
  }
  return stored;
}
