import { BadRequestException, NotFoundException } from '@nestjs/common';

jest.mock('../../../workspace/services/workspace/workspace.service', () => ({
  WorkspaceService: class MockWorkspaceService {},
}));

jest.mock('@aucobot/workspace-sync', () => {
  class AgentCollaborationValidationError extends Error {
    name = 'AgentCollaborationValidationError';
  }

  function normalizeCollaborationSettings(input: {
    enabled: boolean;
    memberSlugs: string[];
  }) {
    const seen = new Set<string>();
    const memberSlugs: string[] = [];
    for (const raw of input.memberSlugs) {
      const slug = String(raw).trim().toLowerCase();
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      memberSlugs.push(slug);
    }
    return { enabled: Boolean(input.enabled), memberSlugs };
  }

  function parseCollaborationMemberSlugs(raw: unknown): string[] {
    return Array.isArray(raw)
      ? raw.map((v) => String(v).trim().toLowerCase()).filter(Boolean)
      : [];
  }

  function legacyTeamFormSlice(formData: unknown) {
    if (!formData || typeof formData !== 'object') {
      return { teamEnabled: false, allowedAgentSlugs: [] };
    }
    const o = formData as Record<string, unknown>;
    return {
      teamEnabled: Boolean(o.teamEnabled),
      allowedAgentSlugs: Array.isArray(o.allowedAgentSlugs)
        ? o.allowedAgentSlugs.map((s) => String(s).trim().toLowerCase()).filter(Boolean)
        : [],
    };
  }

  function buildAgentToAgentAllowList(
    enabledAgents: Array<{
      slug: string;
      formData: { teamEnabled: boolean; allowedAgentSlugs: string[] };
    }>,
  ) {
    const enabledSlugs = new Set(enabledAgents.map((row) => row.slug));
    const allow = new Set<string>(['main']);
    let anyTeamEnabled = false;
    for (const row of enabledAgents) {
      if (!row.formData.teamEnabled) continue;
      anyTeamEnabled = true;
      allow.add(row.slug);
      for (const peer of row.formData.allowedAgentSlugs) {
        if (enabledSlugs.has(peer)) allow.add(peer);
      }
    }
    if (!anyTeamEnabled) return { enabled: false, allow: [] };
    return { enabled: true, allow: [...allow].sort() };
  }

  function deriveCollaborationFromLegacyAgents(
    agents: Array<{
      slug: string;
      formData: { teamEnabled: boolean; allowedAgentSlugs: string[] };
    }>,
  ) {
    const legacy = buildAgentToAgentAllowList(agents);
    if (!legacy.enabled) return { enabled: false, memberSlugs: [] };
    return {
      enabled: true,
      memberSlugs: legacy.allow.filter((slug) => slug !== 'main'),
    };
  }

  function resolveProjectCollaborationSettings(params: {
    stored: { enabled: boolean; memberSlugs: string[] };
    legacyAgents: Array<{
      slug: string;
      formData: { teamEnabled: boolean; allowedAgentSlugs: string[] };
    }>;
  }) {
    const hasStored =
      params.stored.enabled || params.stored.memberSlugs.length > 0;
    if (hasStored) return normalizeCollaborationSettings(params.stored);
    return normalizeCollaborationSettings(
      deriveCollaborationFromLegacyAgents(params.legacyAgents),
    );
  }

  function buildAgentToAgentAllowListFromCollaboration(
    collaboration: { enabled: boolean; memberSlugs: string[] },
    enabledAgentSlugs: string[],
  ) {
    const normalized = normalizeCollaborationSettings(collaboration);
    if (!normalized.enabled || normalized.memberSlugs.length === 0) {
      return { enabled: false, allow: [] };
    }
    const enabledSlugs = new Set(enabledAgentSlugs);
    const allow = new Set<string>(['main']);
    for (const slug of normalized.memberSlugs) {
      if (enabledSlugs.has(slug)) allow.add(slug);
    }
    return {
      enabled: true,
      allow: [...allow].sort(),
    };
  }

  function validateCollaborationSettings(params: {
    collaboration: { enabled: boolean; memberSlugs: string[] };
    projectAgents: Array<{ slug: string; enabled: boolean }>;
  }) {
    const normalized = normalizeCollaborationSettings(params.collaboration);
    if (!normalized.enabled) return;
    if (normalized.memberSlugs.length === 0) {
      throw new AgentCollaborationValidationError(
        'Select at least one agent when collaboration is enabled',
      );
    }
    const bySlug = new Map(params.projectAgents.map((a) => [a.slug, a]));
    for (const slug of normalized.memberSlugs) {
      const agent = bySlug.get(slug);
      if (!agent?.enabled) {
        throw new AgentCollaborationValidationError(
          `Agent is disabled and cannot be in collaboration: ${slug}`,
        );
      }
    }
  }

  function removeSlugFromCollaborationMembers(
    collaboration: { enabled: boolean; memberSlugs: string[] },
    removedSlug: string,
  ) {
    const slug = removedSlug.trim().toLowerCase();
    if (!collaboration.memberSlugs.includes(slug)) return null;
    return normalizeCollaborationSettings({
      ...collaboration,
      memberSlugs: collaboration.memberSlugs.filter((m) => m !== slug),
    });
  }

  return {
    AgentCollaborationValidationError,
    normalizeCollaborationSettings,
    parseCollaborationMemberSlugs,
    legacyTeamFormSlice,
    resolveProjectCollaborationSettings,
    buildAgentToAgentAllowListFromCollaboration,
    validateCollaborationSettings,
    removeSlugFromCollaborationMembers,
  };
});

import { CollaborationService } from '../collaboration/collaboration.service';

const PROJECT_ID = 'proj_collab_1';

function createService() {
  const prisma = {
    project: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    projectAgent: {
      findMany: jest.fn(),
    },
  };
  const workspace = {
    syncProjectRuntime: jest.fn().mockResolvedValue(undefined),
  };
  const service = new CollaborationService(
    prisma as never,
    workspace as never,
  );
  return { service, prisma, workspace };
}

describe('CollaborationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns stored collaboration settings', async () => {
    const { service, prisma } = createService();
    prisma.project.findUnique.mockResolvedValue({
      collaborationEnabled: true,
      collaborationMemberSlugs: ['agent-a', 'agent-b'],
    });
    prisma.projectAgent.findMany.mockResolvedValue([
      { slug: 'agent-a', enabled: true, formData: {} },
      { slug: 'agent-b', enabled: true, formData: {} },
    ]);

    const result = await service.get(PROJECT_ID);

    expect(result.enabled).toBe(true);
    expect(result.memberSlugs).toEqual(['agent-a', 'agent-b']);
    expect(result.legacyDerived).toBe(false);
    expect(result.effectiveAllow).toContain('main');
  });

  it('derives collaboration from legacy team formData when project has none', async () => {
    const { service, prisma, workspace } = createService();
    prisma.project.findUnique.mockResolvedValue({
      collaborationEnabled: false,
      collaborationMemberSlugs: [],
    });
    prisma.projectAgent.findMany.mockResolvedValue([
      {
        slug: 'agent-a',
        enabled: true,
        formData: { teamEnabled: true, allowedAgentSlugs: ['agent-b'] },
      },
      { slug: 'agent-b', enabled: true, formData: {} },
    ]);

    prisma.project.update.mockResolvedValue({});

    const result = await service.get(PROJECT_ID);

    expect(result.legacyDerived).toBe(false);
    expect(result.enabled).toBe(true);
    expect(result.memberSlugs).toEqual(expect.arrayContaining(['agent-a', 'agent-b']));
    expect(prisma.project.update).toHaveBeenCalled();
    expect(workspace.syncProjectRuntime).toHaveBeenCalledWith(PROJECT_ID);
  });

  it('updates collaboration and syncs runtime', async () => {
    const { service, prisma, workspace } = createService();
    prisma.projectAgent.findMany.mockResolvedValue([
      { slug: 'agent-a', enabled: true, formData: {} },
      { slug: 'agent-b', enabled: true, formData: {} },
    ]);
    prisma.project.update.mockResolvedValue({});

    const result = await service.update(PROJECT_ID, {
      enabled: true,
      memberSlugs: ['agent-a', 'agent-b'],
    });

    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: PROJECT_ID },
      data: {
        collaborationEnabled: true,
        collaborationMemberSlugs: ['agent-a', 'agent-b'],
      },
    });
    expect(workspace.syncProjectRuntime).toHaveBeenCalledWith(PROJECT_ID);
    expect(result.legacyDerived).toBe(false);
  });

  it('rejects enabled collaboration without members', async () => {
    const { service, prisma } = createService();
    prisma.projectAgent.findMany.mockResolvedValue([]);

    await expect(
      service.update(PROJECT_ID, { enabled: true, memberSlugs: [] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when project is missing on get', async () => {
    const { service, prisma } = createService();
    prisma.project.findUnique.mockResolvedValue(null);

    await expect(service.get(PROJECT_ID)).rejects.toBeInstanceOf(NotFoundException);
  });
});
