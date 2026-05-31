import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { mkdir, rm, writeFile } from 'node:fs/promises';

jest.mock('../workspace/workspace.service', () => ({
  WorkspaceService: class MockWorkspaceService {},
}));

jest.mock('node:fs/promises', () => ({
  mkdir: jest.fn(),
  rm: jest.fn(),
  writeFile: jest.fn(),
}));

jest.mock('@aucobot/workspace-sync', () => {
  class AgentTeamValidationError extends Error {
    name = 'AgentTeamValidationError';
  }

  const AGENT_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,62}$/;

  function parseAgentFormData(raw: unknown) {
    if (!raw || typeof raw !== 'object') {
      throw new Error('Invalid agent formData');
    }
    const o = raw as Record<string, unknown>;
    return {
      name: String(o.name ?? '').trim(),
      description: String(o.description ?? ''),
      avatar: String(o.avatar ?? '🤖').trim() || '🤖',
      tags: Array.isArray(o.tags) ? o.tags.map((t) => String(t).trim()).filter(Boolean) : [],
      vibe: 'professional',
      instructionsMode: o.instructionsMode === 'advanced' ? 'advanced' : 'simple',
      instructionsRole: String(o.instructionsRole ?? ''),
      instructionsRules: String(o.instructionsRules ?? ''),
      instructionsConstraints: String(o.instructionsConstraints ?? ''),
      instructionsOutputFormat: String(o.instructionsOutputFormat ?? ''),
      instructionsAdvanced: String(o.instructionsAdvanced ?? ''),
      toolsNotes: String(o.toolsNotes ?? ''),
      model: String(o.model ?? 'google/gemini-2.5-flash'),
      sandboxEnabled: Boolean(o.sandboxEnabled),
      askPolicy: 'on-miss',
      safeBins: [] as string[],
      timeoutSec: 60,
      teamEnabled: Boolean(o.teamEnabled),
      allowedAgentSlugs: Array.isArray(o.allowedAgentSlugs)
        ? o.allowedAgentSlugs.map((s) => String(s).trim()).filter(Boolean)
        : [],
    };
  }

  function normalizeAgentTeamSettings(input: {
    teamEnabled: boolean;
    allowedAgentSlugs: string[];
  }) {
    const seen = new Set<string>();
    const allowedAgentSlugs: string[] = [];
    for (const raw of input.allowedAgentSlugs) {
      const slug = String(raw).trim().toLowerCase();
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      allowedAgentSlugs.push(slug);
      if (allowedAgentSlugs.length >= 50) break;
    }
    return { teamEnabled: Boolean(input.teamEnabled), allowedAgentSlugs };
  }

  function validateAgentTeamSettings(params: {
    form: { teamEnabled: boolean; allowedAgentSlugs: string[] };
    currentAgentSlug?: string;
    projectAgents: Array<{ slug: string; enabled: boolean }>;
  }) {
    const normalized = normalizeAgentTeamSettings(params.form);
    if (!normalized.teamEnabled) return;
    if (normalized.allowedAgentSlugs.length === 0) {
      throw new AgentTeamValidationError(
        'Select at least one agent when sub-agent calling is enabled',
      );
    }
    const bySlug = new Map(params.projectAgents.map((a) => [a.slug, a]));
    for (const slug of normalized.allowedAgentSlugs) {
      if (!AGENT_SLUG_PATTERN.test(slug)) {
        throw new AgentTeamValidationError(`Invalid agent slug: ${slug}`);
      }
      if (slug === 'main') {
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

  function applyAgentTeamSettings(form: ReturnType<typeof parseAgentFormData>) {
    return { ...form, ...normalizeAgentTeamSettings(form) };
  }

  function removeSlugFromTeamAllowList(formData: unknown, removedSlug: string) {
    const form = parseAgentFormData(formData);
    if (!form.allowedAgentSlugs.includes(removedSlug)) return null;
    return {
      ...form,
      allowedAgentSlugs: form.allowedAgentSlugs.filter((slug) => slug !== removedSlug),
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
      const team = normalizeAgentTeamSettings(row.formData);
      if (!team.teamEnabled) continue;
      anyTeamEnabled = true;
      allow.add(row.slug);
      for (const peerSlug of team.allowedAgentSlugs) {
        if (enabledSlugs.has(peerSlug)) allow.add(peerSlug);
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

  return {
    parseAgentFormData,
    normalizeAgentTeamSettings,
    AgentTeamValidationError,
    validateAgentTeamSettings,
    applyAgentTeamSettings,
    removeSlugFromTeamAllowList,
    buildAgentToAgentAllowList,
    compileAgentBootstrap: jest.fn(() => ({
      files: {
        'IDENTITY.md': '# identity',
        'SOUL.md': '# soul',
        'AGENTS.md': '# agents',
        'TOOLS.md': '# tools',
      },
    })),
  };
});

import { buildAgentToAgentAllowList } from '@aucobot/workspace-sync';
import { AgentService } from './agent.service';

const mkdirMock = mkdir as jest.MockedFunction<typeof mkdir>;
const rmMock = rm as jest.MockedFunction<typeof rm>;
const writeFileMock = writeFile as jest.MockedFunction<typeof writeFile>;

const PROJECT_ID = 'proj_test_1';
const AGENT_SLUG = 'test-agent';

function validFormData(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Test Agent',
    description: 'Helps with tasks',
    avatar: '🤖',
    tags: [] as string[],
    vibe: 'professional',
    instructionsMode: 'simple',
    instructionsRole: 'You are a helpful assistant',
    instructionsRules: '',
    instructionsConstraints: '',
    instructionsOutputFormat: '',
    instructionsAdvanced: '',
    toolsNotes: '',
    model: 'google/gemini-2.5-flash',
    sandboxEnabled: false,
    askPolicy: 'on-miss',
    safeBins: [] as string[],
    timeoutSec: 60,
    teamEnabled: false,
    allowedAgentSlugs: [] as string[],
    ...overrides,
  };
}

function buildAgentRow(overrides: Partial<Record<string, unknown>> = {}) {
  const formData =
    overrides.formData !== undefined
      ? validFormData(overrides.formData as Record<string, unknown>)
      : validFormData();
  return {
    id: 'agent-row-1',
    projectId: PROJECT_ID,
    slug: AGENT_SLUG,
    name: formData.name,
    description: formData.description,
    avatar: formData.avatar,
    formData,
    enabled: true,
    isDefault: true,
    lastSyncedAt: null,
    lastSyncError: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function buildTemplateRow() {
  return {
    slug: 'default',
    name: 'Default',
    description: 'Starter template',
    avatar: '🤖',
    vibe: 'friendly',
    defaultModel: 'google/gemini-2.5-flash',
    toolsProfile: 'default',
    sandboxEnabled: false,
    bootstrapIdentity: 'identity',
    bootstrapSoul: 'soul',
    bootstrapAgents: 'agents',
    isActive: true,
    sortOrder: 0,
  };
}

function createService() {
  const prisma = {
    agentTemplate: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    projectAgent: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
  };
  const workspace = {
    syncProjectRuntime: jest.fn().mockResolvedValue(undefined),
    ensureProjectLayout: jest.fn().mockResolvedValue('/data/projects/proj_test_1'),
    resolveProjectDataDir: jest.fn().mockReturnValue('/data/projects/proj_test_1'),
  };
  const service = new AgentService(prisma as never, workspace as never);
  return { service, prisma, workspace };
}

describe('AgentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mkdirMock.mockResolvedValue(undefined);
    rmMock.mockResolvedValue(undefined);
    writeFileMock.mockResolvedValue(undefined);
  });

  describe('listTemplates', () => {
    it('maps active templates from database', async () => {
      const { service, prisma } = createService();
      prisma.agentTemplate.findMany.mockResolvedValue([buildTemplateRow()]);

      const rows = await service.listTemplates();

      expect(prisma.agentTemplate.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        slug: 'default',
        bootstrapFiles: {
          identity: 'identity',
          soul: 'soul',
          agents: 'agents',
        },
      });
    });
  });

  describe('getTemplate', () => {
    it('throws when template is missing', async () => {
      const { service, prisma } = createService();
      prisma.agentTemplate.findFirst.mockResolvedValue(null);

      await expect(service.getTemplate('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns template row', async () => {
      const { service, prisma } = createService();
      prisma.agentTemplate.findFirst.mockResolvedValue(buildTemplateRow());

      const row = await service.getTemplate('default');

      expect(row.slug).toBe('default');
      expect(row.defaultModel).toBe('google/gemini-2.5-flash');
    });
  });

  describe('list', () => {
    it('maps project agents to list DTO', async () => {
      const { service, prisma } = createService();
      prisma.projectAgent.findMany.mockResolvedValue([buildAgentRow()]);

      const rows = await service.list(PROJECT_ID);

      expect(prisma.projectAgent.findMany).toHaveBeenCalledWith({
        where: { projectId: PROJECT_ID },
        orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
      });
      expect(rows[0]).toMatchObject({
        slug: AGENT_SLUG,
        name: 'Test Agent',
        model: 'google/gemini-2.5-flash',
        isDefault: true,
      });
    });
  });

  describe('get', () => {
    it('throws when agent not found', async () => {
      const { service, prisma } = createService();
      prisma.projectAgent.findUnique.mockResolvedValue(null);

      await expect(service.get(PROJECT_ID, AGENT_SLUG)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns agent detail with parsed formData', async () => {
      const { service, prisma } = createService();
      prisma.projectAgent.findUnique.mockResolvedValue(buildAgentRow());

      const detail = await service.get(PROJECT_ID, AGENT_SLUG);

      expect(detail.slug).toBe(AGENT_SLUG);
      expect(detail.formData.name).toBe('Test Agent');
      expect(detail.createdAt).toBe('2026-01-01T00:00:00.000Z');
    });
  });

  describe('create', () => {
    it('rejects invalid form (empty name)', async () => {
      const { service } = createService();

      await expect(
        service.create({
          projectId: PROJECT_ID,
          formData: validFormData({ name: '   ' }),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects duplicate slug', async () => {
      const { service, prisma } = createService();
      prisma.projectAgent.findMany.mockResolvedValue([]);
      prisma.projectAgent.findUnique.mockResolvedValue(buildAgentRow());

      await expect(
        service.create({
          projectId: PROJECT_ID,
          slug: AGENT_SLUG,
          formData: validFormData(),
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates first agent as default and syncs to disk', async () => {
      const { service, prisma, workspace } = createService();
      const row = buildAgentRow();
      prisma.projectAgent.findMany.mockResolvedValue([]);
      prisma.projectAgent.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValue(row);
      prisma.projectAgent.count.mockResolvedValue(0);
      prisma.projectAgent.updateMany.mockResolvedValue({ count: 0 });
      prisma.projectAgent.create.mockResolvedValue(row);
      prisma.projectAgent.update.mockResolvedValue(row);

      const detail = await service.create({
        projectId: PROJECT_ID,
        slug: AGENT_SLUG,
        formData: validFormData(),
      });

      expect(prisma.projectAgent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            projectId: PROJECT_ID,
            slug: AGENT_SLUG,
            enabled: true,
            isDefault: true,
          }),
        }),
      );
      expect(mkdirMock).toHaveBeenCalled();
      expect(writeFileMock).toHaveBeenCalled();
      expect(workspace.syncProjectRuntime).toHaveBeenCalledWith(PROJECT_ID);
      expect(detail.slug).toBe(AGENT_SLUG);
    });

    it('skips disk sync when agent is created disabled', async () => {
      const { service, prisma, workspace } = createService();
      const row = buildAgentRow({ enabled: false, isDefault: false });
      prisma.projectAgent.findMany.mockResolvedValue([]);
      prisma.projectAgent.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValue(row);
      prisma.projectAgent.count.mockResolvedValue(1);
      prisma.projectAgent.create.mockResolvedValue(row);

      await service.create({
        projectId: PROJECT_ID,
        formData: validFormData(),
        enabled: false,
        isDefault: false,
      });

      expect(mkdirMock).not.toHaveBeenCalled();
      expect(workspace.syncProjectRuntime).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates agent and syncs runtime', async () => {
      const { service, prisma, workspace } = createService();
      const row = buildAgentRow();
      prisma.projectAgent.findMany.mockResolvedValue([row]);
      prisma.projectAgent.findUnique.mockResolvedValue(row);
      prisma.projectAgent.update.mockResolvedValue(row);

      const detail = await service.update(PROJECT_ID, AGENT_SLUG, {
        formData: validFormData({ name: 'Renamed Agent' }),
      });

      expect(prisma.projectAgent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'Renamed Agent' }),
        }),
      );
      expect(workspace.syncProjectRuntime).toHaveBeenCalledWith(PROJECT_ID);
      expect(detail.name).toBe('Test Agent');
    });
  });

  describe('team settings', () => {
    it('rejects team enabled without allowed agents on create', async () => {
      const { service, prisma } = createService();
      prisma.projectAgent.findMany.mockResolvedValue([]);

      await expect(
        service.create({
          projectId: PROJECT_ID,
          formData: validFormData({ teamEnabled: true, allowedAgentSlugs: [] }),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects unknown allowed agent slug on update', async () => {
      const { service, prisma } = createService();
      const row = buildAgentRow();
      prisma.projectAgent.findMany.mockResolvedValue([row]);
      prisma.projectAgent.findUnique.mockResolvedValue(row);

      await expect(
        service.update(PROJECT_ID, AGENT_SLUG, {
          formData: validFormData({
            teamEnabled: true,
            allowedAgentSlugs: ['missing-agent'],
          }),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects self in allowed agents on update', async () => {
      const { service, prisma } = createService();
      const row = buildAgentRow();
      prisma.projectAgent.findMany.mockResolvedValue([row]);
      prisma.projectAgent.findUnique.mockResolvedValue(row);

      await expect(
        service.update(PROJECT_ID, AGENT_SLUG, {
          formData: validFormData({
            teamEnabled: true,
            allowedAgentSlugs: [AGENT_SLUG],
          }),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('deduplicates allowed slugs on save', async () => {
      const { service, prisma } = createService();
      const row = buildAgentRow();
      const peer = buildAgentRow({ id: 'peer-1', slug: 'peer-agent', enabled: true });
      prisma.projectAgent.findMany.mockResolvedValue([row, peer]);
      prisma.projectAgent.findUnique.mockResolvedValue(row);
      prisma.projectAgent.update.mockResolvedValue(row);

      await service.update(PROJECT_ID, AGENT_SLUG, {
        formData: validFormData({
          teamEnabled: true,
          allowedAgentSlugs: ['peer-agent', 'peer-agent'],
        }),
      });

      expect(prisma.projectAgent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            formData: expect.objectContaining({
              allowedAgentSlugs: ['peer-agent'],
            }),
          }),
        }),
      );
    });

    it('removes deleted slug from peer allow lists', async () => {
      const { service, prisma } = createService();
      const row = buildAgentRow({ slug: 'removed-agent', isDefault: false });
      const peer = buildAgentRow({
        id: 'peer-1',
        slug: 'caller-agent',
        formData: validFormData({
          teamEnabled: true,
          allowedAgentSlugs: ['removed-agent', 'other-agent'],
        }),
      });
      prisma.projectAgent.findUnique.mockResolvedValue(row);
      prisma.projectAgent.findMany.mockResolvedValue([peer]);

      await service.remove(PROJECT_ID, 'removed-agent');

      expect(prisma.projectAgent.update).toHaveBeenCalledWith({
        where: { id: peer.id },
        data: {
          formData: expect.objectContaining({
            allowedAgentSlugs: ['other-agent'],
          }),
        },
      });
    });
  });

  describe('setEnabled', () => {
    it('syncs disk when enabling agent', async () => {
      const { service, prisma, workspace } = createService();
      const disabled = buildAgentRow({ enabled: false });
      const enabled = buildAgentRow({ enabled: true });
      prisma.projectAgent.findUnique
        .mockResolvedValueOnce(disabled)
        .mockResolvedValue(enabled);
      prisma.projectAgent.update.mockResolvedValue(enabled);

      await service.setEnabled(PROJECT_ID, AGENT_SLUG, true);

      expect(mkdirMock).toHaveBeenCalled();
      expect(workspace.syncProjectRuntime).toHaveBeenCalledWith(PROJECT_ID);
    });
  });

  describe('setDefault', () => {
    it('clears other defaults, enables agent, and syncs', async () => {
      const { service, prisma, workspace } = createService();
      const row = buildAgentRow({ isDefault: false, enabled: false });
      const updated = buildAgentRow({ isDefault: true, enabled: true });
      prisma.projectAgent.findUnique
        .mockResolvedValueOnce(row)
        .mockResolvedValue(updated);
      prisma.projectAgent.updateMany.mockResolvedValue({ count: 1 });
      prisma.projectAgent.update.mockResolvedValue(updated);

      await service.setDefault(PROJECT_ID, AGENT_SLUG);

      expect(prisma.projectAgent.updateMany).toHaveBeenCalledWith({
        where: { projectId: PROJECT_ID, isDefault: true },
        data: { isDefault: false },
      });
      expect(prisma.projectAgent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isDefault: true, enabled: true },
        }),
      );
      expect(workspace.syncProjectRuntime).toHaveBeenCalledWith(PROJECT_ID);
    });
  });

  describe('duplicate', () => {
    it('creates disabled copy with new slug', async () => {
      const { service, prisma } = createService();
      const source = buildAgentRow();
      const copy = buildAgentRow({
        slug: 'test-agent-copy',
        name: 'Test Agent (Copy)',
        enabled: false,
        isDefault: false,
      });
      prisma.projectAgent.findMany.mockResolvedValue([source]);
      prisma.projectAgent.findUnique
        .mockResolvedValueOnce(source)
        .mockResolvedValueOnce(null)
        .mockResolvedValue(copy);
      prisma.projectAgent.count.mockResolvedValue(1);
      prisma.projectAgent.create.mockResolvedValue(copy);

      const detail = await service.duplicate(PROJECT_ID, AGENT_SLUG, {
        slug: 'test-agent-copy',
        name: 'Test Agent (Copy)',
      });

      expect(prisma.projectAgent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: 'test-agent-copy',
            enabled: false,
            isDefault: false,
          }),
        }),
      );
      expect(detail.slug).toBe('test-agent-copy');
    });
  });

  describe('remove', () => {
    it('deletes agent workspace and syncs runtime', async () => {
      const { service, prisma, workspace } = createService();
      const row = buildAgentRow({ isDefault: false });
      prisma.projectAgent.findUnique.mockResolvedValue(row);
      prisma.projectAgent.findMany.mockResolvedValue([]);

      await service.remove(PROJECT_ID, AGENT_SLUG);

      expect(prisma.projectAgent.delete).toHaveBeenCalledWith({
        where: { id: row.id },
      });
      expect(rmMock).toHaveBeenCalledWith(
        expect.stringContaining(`workspace-${AGENT_SLUG}`),
        { recursive: true, force: true },
      );
      expect(workspace.syncProjectRuntime).toHaveBeenCalledWith(PROJECT_ID);
    });

    it('promotes next enabled agent when default is removed', async () => {
      const { service, prisma } = createService();
      const row = buildAgentRow({ isDefault: true });
      const next = buildAgentRow({
        id: 'agent-row-2',
        slug: 'backup-agent',
        isDefault: false,
      });
      prisma.projectAgent.findUnique.mockResolvedValue(row);
      prisma.projectAgent.findMany.mockResolvedValue([]);
      prisma.projectAgent.findFirst.mockResolvedValue(next);

      await service.remove(PROJECT_ID, AGENT_SLUG);

      expect(prisma.projectAgent.update).toHaveBeenCalledWith({
        where: { id: next.id },
        data: { isDefault: true },
      });
    });
  });

  describe('syncAllEnabled', () => {
    it('returns synced and failed counts', async () => {
      const { service, prisma, workspace } = createService();
      const ok = buildAgentRow({ id: 'a1', slug: 'agent-a' });
      const bad = buildAgentRow({ id: 'a2', slug: 'agent-b' });
      prisma.projectAgent.findMany.mockResolvedValue([ok, bad]);
      writeFileMock
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('disk full'));
      prisma.projectAgent.update.mockResolvedValue({});

      const result = await service.syncAllEnabled(PROJECT_ID);

      expect(result).toEqual({ synced: 1, failed: 1 });
      expect(workspace.syncProjectRuntime).toHaveBeenCalledWith(PROJECT_ID);
    });
  });

  describe('buildAgentToAgentAllowList', () => {
    it('returns disabled when no agent has team enabled', () => {
      expect(
        buildAgentToAgentAllowList([
          { slug: 'agent-a', formData: { teamEnabled: false, allowedAgentSlugs: [] } },
          { slug: 'agent-b', formData: { teamEnabled: false, allowedAgentSlugs: ['agent-a'] } },
        ]),
      ).toEqual({ enabled: false, allow: [] });
    });

    it('includes main, caller, and allowed enabled peers', () => {
      expect(
        buildAgentToAgentAllowList([
          {
            slug: 'agent-a',
            formData: { teamEnabled: true, allowedAgentSlugs: ['agent-b'] },
          },
          { slug: 'agent-b', formData: { teamEnabled: false, allowedAgentSlugs: [] } },
        ]),
      ).toEqual({ enabled: true, allow: ['agent-a', 'agent-b', 'main'] });
    });

    it('ignores peers that are not in the enabled agent list', () => {
      expect(
        buildAgentToAgentAllowList([
          {
            slug: 'agent-a',
            formData: { teamEnabled: true, allowedAgentSlugs: ['agent-b', 'agent-c'] },
          },
          { slug: 'agent-b', formData: { teamEnabled: false, allowedAgentSlugs: [] } },
        ]),
      ).toEqual({ enabled: true, allow: ['agent-a', 'agent-b', 'main'] });
    });

    it('unions allow lists from multiple team-enabled agents', () => {
      expect(
        buildAgentToAgentAllowList([
          {
            slug: 'agent-a',
            formData: { teamEnabled: true, allowedAgentSlugs: ['agent-b'] },
          },
          {
            slug: 'agent-b',
            formData: { teamEnabled: true, allowedAgentSlugs: ['agent-c'] },
          },
          { slug: 'agent-c', formData: { teamEnabled: false, allowedAgentSlugs: [] } },
        ]),
      ).toEqual({ enabled: true, allow: ['agent-a', 'agent-b', 'agent-c', 'main'] });
    });
  });
});
