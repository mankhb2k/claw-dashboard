const AGENT_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,62}$/;
const MAX_COLLABORATION_MEMBERS = 50;
const MAX_LEGACY_TEAM_PEERS = 50;
const RESERVED_SLUGS = new Set(['main']);

export type AgentToAgentToolsConfig = {
  enabled: boolean;
  allow: string[];
};

export type LegacyAgentTeamFormData = {
  teamEnabled: boolean;
  allowedAgentSlugs: string[];
};

export type LegacyAgentTeamRow = {
  slug: string;
  formData: LegacyAgentTeamFormData;
};

export type ProjectCollaborationSettings = {
  enabled: boolean;
  memberSlugs: string[];
};

export class AgentCollaborationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AgentCollaborationValidationError';
  }
}

export function parseCollaborationMemberSlugs(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map((value) => String(value).trim().toLowerCase()).filter(Boolean);
}

export function normalizeCollaborationSettings(
  input: ProjectCollaborationSettings,
): ProjectCollaborationSettings {
  const seen = new Set<string>();
  const memberSlugs: string[] = [];

  for (const raw of input.memberSlugs) {
    const slug = String(raw).trim().toLowerCase();
    if (!slug || seen.has(slug)) {
      continue;
    }
    seen.add(slug);
    memberSlugs.push(slug);
    if (memberSlugs.length >= MAX_COLLABORATION_MEMBERS) {
      break;
    }
  }

  return {
    enabled: Boolean(input.enabled),
    memberSlugs,
  };
}

function normalizeLegacyTeamSettings(input: LegacyAgentTeamFormData): LegacyAgentTeamFormData {
  const seen = new Set<string>();
  const allowedAgentSlugs: string[] = [];

  for (const raw of input.allowedAgentSlugs) {
    const slug = String(raw).trim().toLowerCase();
    if (!slug || seen.has(slug)) {
      continue;
    }
    seen.add(slug);
    allowedAgentSlugs.push(slug);
    if (allowedAgentSlugs.length >= MAX_LEGACY_TEAM_PEERS) {
      break;
    }
  }

  return {
    teamEnabled: Boolean(input.teamEnabled),
    allowedAgentSlugs,
  };
}

/** @internal Legacy per-agent team → allow list (migration read path only). */
function buildLegacyAgentToAgentAllowList(
  enabledAgents: LegacyAgentTeamRow[],
): AgentToAgentToolsConfig {
  const enabledSlugs = new Set(enabledAgents.map((row) => row.slug));
  const allow = new Set<string>(['main']);
  let anyTeamEnabled = false;

  for (const row of enabledAgents) {
    const team = normalizeLegacyTeamSettings(row.formData);
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

/** Build OpenClaw `tools.agentToAgent` from project-level collaboration settings. */
export function buildAgentToAgentAllowListFromCollaboration(
  collaboration: ProjectCollaborationSettings,
  enabledAgentSlugs: string[],
): AgentToAgentToolsConfig {
  const normalized = normalizeCollaborationSettings(collaboration);
  if (!normalized.enabled || normalized.memberSlugs.length === 0) {
    return { enabled: false, allow: [] };
  }

  const enabledSlugs = new Set(enabledAgentSlugs);
  const allow = new Set<string>(['main']);

  for (const slug of normalized.memberSlugs) {
    if (enabledSlugs.has(slug)) {
      allow.add(slug);
    }
  }

  if (allow.size <= 1) {
    return { enabled: false, allow: [] };
  }

  return {
    enabled: true,
    allow: [...allow].sort((a, b) => a.localeCompare(b)),
  };
}

/** Derive project collaboration from legacy per-agent team fields (one-time read path). */
export function deriveCollaborationFromLegacyAgents(
  agents: LegacyAgentTeamRow[],
): ProjectCollaborationSettings {
  const legacy = buildLegacyAgentToAgentAllowList(agents);
  if (!legacy.enabled) {
    return { enabled: false, memberSlugs: [] };
  }

  const memberSlugs = legacy.allow.filter((slug) => slug !== 'main');
  return {
    enabled: memberSlugs.length > 0,
    memberSlugs,
  };
}

export function validateCollaborationSettings(params: {
  collaboration: ProjectCollaborationSettings;
  projectAgents: { slug: string; enabled: boolean }[];
}): void {
  const normalized = normalizeCollaborationSettings(params.collaboration);
  if (!normalized.enabled) {
    return;
  }

  if (normalized.memberSlugs.length === 0) {
    throw new AgentCollaborationValidationError(
      'Select at least one agent when collaboration is enabled',
    );
  }

  const bySlug = new Map(params.projectAgents.map((agent) => [agent.slug, agent]));

  for (const slug of normalized.memberSlugs) {
    if (!AGENT_SLUG_PATTERN.test(slug)) {
      throw new AgentCollaborationValidationError(`Invalid agent slug: ${slug}`);
    }
    if (RESERVED_SLUGS.has(slug)) {
      throw new AgentCollaborationValidationError(
        'Cannot add system agent "main" to collaboration members',
      );
    }

    const agent = bySlug.get(slug);
    if (!agent) {
      throw new AgentCollaborationValidationError(`Agent not found in project: ${slug}`);
    }
    if (!agent.enabled) {
      throw new AgentCollaborationValidationError(
        `Agent is disabled and cannot be in collaboration: ${slug}`,
      );
    }
  }
}

export function removeSlugFromCollaborationMembers(
  collaboration: ProjectCollaborationSettings,
  removedSlug: string,
): ProjectCollaborationSettings | null {
  const slug = removedSlug.trim().toLowerCase();
  if (!collaboration.memberSlugs.includes(slug)) {
    return null;
  }
  return normalizeCollaborationSettings({
    ...collaboration,
    memberSlugs: collaboration.memberSlugs.filter((member) => member !== slug),
  });
}

/** Read legacy team flags from raw stored formData (migration only). */
export function legacyTeamFormSlice(formData: unknown): LegacyAgentTeamFormData {
  if (!formData || typeof formData !== 'object') {
    return { teamEnabled: false, allowedAgentSlugs: [] };
  }
  const o = formData as Record<string, unknown>;
  const allowedAgentSlugs = Array.isArray(o.allowedAgentSlugs)
    ? o.allowedAgentSlugs.map((s) => String(s).trim().toLowerCase()).filter(Boolean)
    : [];
  return {
    teamEnabled: Boolean(o.teamEnabled),
    allowedAgentSlugs,
  };
}

export function resolveProjectCollaborationSettings(params: {
  stored: ProjectCollaborationSettings;
  legacyAgents: LegacyAgentTeamRow[];
}): ProjectCollaborationSettings {
  const hasStored =
    params.stored.enabled || params.stored.memberSlugs.length > 0;
  if (hasStored) {
    return normalizeCollaborationSettings(params.stored);
  }
  return normalizeCollaborationSettings(
    deriveCollaborationFromLegacyAgents(params.legacyAgents),
  );
}

export function shouldPersistDerivedCollaboration(
  stored: ProjectCollaborationSettings,
  resolved: ProjectCollaborationSettings,
): boolean {
  const emptyStored =
    !stored.enabled && stored.memberSlugs.length === 0;
  const hasResolved =
    resolved.enabled && resolved.memberSlugs.length > 0;
  return emptyStored && hasResolved;
}
