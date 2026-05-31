import type { AgentFormInput } from './agent-form.types.js';
import { parseAgentFormData } from './agent-form.types.js';

const AGENT_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,62}$/;
const MAX_ALLOWED_AGENTS = 50;
const RESERVED_SLUGS = new Set(['main']);

export type ProjectAgentPeer = {
  slug: string;
  enabled: boolean;
};

export type AgentToAgentToolsConfig = {
  enabled: boolean;
  allow: string[];
};

export type AgentTeamMergeRow = {
  slug: string;
  formData: Pick<AgentFormInput, 'teamEnabled' | 'allowedAgentSlugs'>;
};

export class AgentTeamValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AgentTeamValidationError';
  }
}

export function normalizeAgentTeamSettings(
  input: Pick<AgentFormInput, 'teamEnabled' | 'allowedAgentSlugs'>,
): Pick<AgentFormInput, 'teamEnabled' | 'allowedAgentSlugs'> {
  const seen = new Set<string>();
  const allowedAgentSlugs: string[] = [];

  for (const raw of input.allowedAgentSlugs) {
    const slug = String(raw).trim().toLowerCase();
    if (!slug || seen.has(slug)) {
      continue;
    }
    seen.add(slug);
    allowedAgentSlugs.push(slug);
    if (allowedAgentSlugs.length >= MAX_ALLOWED_AGENTS) {
      break;
    }
  }

  return {
    teamEnabled: Boolean(input.teamEnabled),
    allowedAgentSlugs,
  };
}

/** Build OpenClaw `tools.agentToAgent` allow list from enabled agents' team settings. */
export function buildAgentToAgentAllowList(
  enabledAgents: AgentTeamMergeRow[],
): AgentToAgentToolsConfig {
  const enabledSlugs = new Set(enabledAgents.map((row) => row.slug));
  const allow = new Set<string>(['main']);
  let anyTeamEnabled = false;

  for (const row of enabledAgents) {
    const team = normalizeAgentTeamSettings(row.formData);
    if (!team.teamEnabled) {
      continue;
    }
    anyTeamEnabled = true;
    allow.add(row.slug);
    for (const peerSlug of team.allowedAgentSlugs) {
      if (enabledSlugs.has(peerSlug)) {
        allow.add(peerSlug);
      }
    }
  }

  if (!anyTeamEnabled) {
    return { enabled: false, allow: [] };
  }

  return {
    enabled: true,
    allow: [...allow].sort((a, b) => a.localeCompare(b)),
  };
}

export function validateAgentTeamSettings(params: {
  form: Pick<AgentFormInput, 'teamEnabled' | 'allowedAgentSlugs'>;
  currentAgentSlug?: string;
  projectAgents: ProjectAgentPeer[];
}): void {
  const normalized = normalizeAgentTeamSettings(params.form);
  if (!normalized.teamEnabled) {
    return;
  }

  if (normalized.allowedAgentSlugs.length === 0) {
    throw new AgentTeamValidationError(
      'Select at least one agent when sub-agent calling is enabled',
    );
  }

  const bySlug = new Map(params.projectAgents.map((agent) => [agent.slug, agent]));

  for (const slug of normalized.allowedAgentSlugs) {
    if (!AGENT_SLUG_PATTERN.test(slug)) {
      throw new AgentTeamValidationError(`Invalid agent slug: ${slug}`);
    }
    if (RESERVED_SLUGS.has(slug)) {
      throw new AgentTeamValidationError(
        'Cannot add system agent "main" to the allow list',
      );
    }
    if (params.currentAgentSlug && slug === params.currentAgentSlug) {
      throw new AgentTeamValidationError('An agent cannot call itself');
    }

    const peer = bySlug.get(slug);
    if (!peer) {
      throw new AgentTeamValidationError(`Agent not found in project: ${slug}`);
    }
    if (!peer.enabled) {
      throw new AgentTeamValidationError(
        `Agent is disabled and cannot be allowed: ${slug}`,
      );
    }
  }
}

export function applyAgentTeamSettings(form: AgentFormInput): AgentFormInput {
  const team = normalizeAgentTeamSettings(form);
  return { ...form, ...team };
}

export function removeSlugFromTeamAllowList(
  formData: unknown,
  removedSlug: string,
): AgentFormInput | null {
  const form = parseAgentFormData(formData);
  if (!form.allowedAgentSlugs.includes(removedSlug)) {
    return null;
  }
  return {
    ...form,
    allowedAgentSlugs: form.allowedAgentSlugs.filter((slug) => slug !== removedSlug),
  };
}
