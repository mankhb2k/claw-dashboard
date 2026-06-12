import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { mkdir, rm, writeFile } from 'node:fs/promises';

jest.mock('../../../workspace/services/workspace/workspace.service', () => ({
  WorkspaceService: class MockWorkspaceService {},
}));

jest.mock('node:fs/promises', () => ({
  mkdir: jest.fn(),
  rm: jest.fn(),
  writeFile: jest.fn(),
}));

jest.mock('../../../chat/lib/project-model-catalog', () => ({
  loadProjectModelCatalog: jest.fn().mockResolvedValue({
    primaryModel: 'google/gemini-2.5-flash',
    providers: [
      {
        providerId: 'gemini',
        displayName: 'Google Gemini',
        defaultModel: 'google/gemini-2.5-flash',
        tested: true,
        models: [
          {
            id: 'gemini-2.5-flash',
            name: 'Gemini 2.5 Flash',
            openclawId: 'google/gemini-2.5-flash',
          },
        ],
      },
    ],
  }),
}));

jest.mock('@aucobot/workspace-sync', () => {
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
      shellExecEnabled: o.shellExecEnabled !== false,
      skillNames: Array.isArray(o.skillNames)
        ? o.skillNames.map((t) => String(t).trim()).filter(Boolean)
        : [],
    };
  }

  function toStoredAgentFormData(form: ReturnType<typeof parseAgentFormData>) {
    const stored: Record<string, unknown> = { ...form };
    delete stored.teamEnabled;
    delete stored.allowedAgentSlugs;
    return stored;
  }

  function parseCollaborationMemberSlugs(raw: unknown): string[] {
    return Array.isArray(raw)
      ? raw.map((v) => String(v).trim().toLowerCase()).filter(Boolean)
      : [];
  }

  return {
    parseAgentFormData,
    parseCollaborationMemberSlugs,
    toStoredAgentFormData,
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
    shellExecEnabled: true,
    skillNames: [] as string[],
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
    project: {
      findUnique: jest.fn(),
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
    projectSkill: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
  const workspace = {
    syncProjectRuntime: jest.fn().mockResolvedValue(undefined),
    ensureProjectLayout: jest.fn().mockResolvedValue('/data/projects/proj_test_1'),
    resolveProjectDataDir: jest.fn().mockReturnValue('/data/projects/proj_test_1'),
  };
  const collaboration = {
    removeMember: jest.fn().mockResolvedValue(undefined),
    addMember: jest.fn().mockResolvedValue(undefined),
  };
  const service = new AgentService(
    prisma as never,
    workspace as never,
    collaboration as never,
  );
  return { service, prisma, workspace, collaboration };
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
      prisma.project.findUnique.mockResolvedValue({
        collaborationEnabled: true,
        collaborationMemberSlugs: [AGENT_SLUG],
      });

      const rows = await service.list(PROJECT_ID);

      expect(prisma.projectAgent.findMany).toHaveBeenCalledWith({
        where: { projectId: PROJECT_ID },
        orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
      });
      expect(rows[0]).toMatchObject({
        slug: AGENT_SLUG,
        name: 'Test Agent',
        model: 'google/gemini-2.5-flash',
        skillsCount: 0,
        isDefault: true,
        inCollaboration: true,
      });
    });

    it('resolves legacy form model to project primary when not in catalog', async () => {
      const { service, prisma } = createService();
      prisma.projectAgent.findMany.mockResolvedValue([
        buildAgentRow({ formData: { model: 'claude-3-5-sonnet' } }),
      ]);
      prisma.project.findUnique.mockResolvedValue({
        collaborationEnabled: false,
        collaborationMemberSlugs: [],
      });

      const rows = await service.list(PROJECT_ID);

      expect(rows[0]?.model).toBe('google/gemini-2.5-flash');
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

    it('rejects unknown or disabled skill names', async () => {
      const { service, prisma } = createService();
      prisma.projectSkill.findMany.mockResolvedValue([
        { name: 'enabled-skill' },
      ]);

      await expect(
        service.create({
          projectId: PROJECT_ID,
          formData: validFormData({ skillNames: ['missing-skill'] }),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
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

  describe('agent form storage', () => {
    it('omits legacy team keys on create', async () => {
      const { service, prisma } = createService();
      const created = buildAgentRow();
      prisma.projectAgent.findMany.mockResolvedValue([]);
      prisma.projectAgent.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValue(created);
      prisma.projectAgent.count.mockResolvedValue(0);
      prisma.projectAgent.create.mockResolvedValue(created);

      await service.create({
        projectId: PROJECT_ID,
        formData: validFormData({
          teamEnabled: true,
          allowedAgentSlugs: ['peer-agent'],
        }),
      });

      const createCall = prisma.projectAgent.create.mock.calls[0][0];
      expect(createCall.data.formData).not.toHaveProperty('teamEnabled');
      expect(createCall.data.formData).not.toHaveProperty('allowedAgentSlugs');
    });

    it('omits legacy team keys on update', async () => {
      const { service, prisma } = createService();
      const row = buildAgentRow();
      prisma.projectAgent.findUnique.mockResolvedValue(row);
      prisma.projectAgent.update.mockResolvedValue(row);

      await service.update(PROJECT_ID, AGENT_SLUG, {
        formData: validFormData({
          teamEnabled: true,
          allowedAgentSlugs: ['peer-agent'],
        }),
      });

      const updateCall = prisma.projectAgent.update.mock.calls[0][0];
      expect(updateCall.data.formData).not.toHaveProperty('teamEnabled');
      expect(updateCall.data.formData).not.toHaveProperty('allowedAgentSlugs');
    });

    it('removes deleted slug from project collaboration', async () => {
      const { service, prisma, collaboration } = createService();
      const row = buildAgentRow({ slug: 'removed-agent', isDefault: false });
      prisma.projectAgent.findUnique.mockResolvedValue(row);
      prisma.projectAgent.findMany.mockResolvedValue([]);

      await service.remove(PROJECT_ID, 'removed-agent');

      expect(collaboration.removeMember).toHaveBeenCalledWith(
        PROJECT_ID,
        'removed-agent',
      );
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
      prisma.project.findUnique.mockResolvedValue({
        collaborationEnabled: false,
        collaborationMemberSlugs: [],
      });
      prisma.projectAgent.update.mockResolvedValue(enabled);

      await service.setEnabled(PROJECT_ID, AGENT_SLUG, true);

      expect(mkdirMock).toHaveBeenCalled();
      expect(workspace.syncProjectRuntime).toHaveBeenCalledWith(PROJECT_ID);
    });

    it('removes agent from collaboration when disabling', async () => {
      const { service, prisma, collaboration } = createService();
      const enabled = buildAgentRow({ enabled: true });
      const disabled = buildAgentRow({ enabled: false });
      prisma.projectAgent.findUnique
        .mockResolvedValueOnce(enabled)
        .mockResolvedValue(disabled);
      prisma.project.findUnique.mockResolvedValue({
        collaborationEnabled: true,
        collaborationMemberSlugs: [AGENT_SLUG],
      });
      prisma.projectAgent.update.mockResolvedValue(disabled);

      await service.setEnabled(PROJECT_ID, AGENT_SLUG, false);

      expect(collaboration.removeMember).toHaveBeenCalledWith(
        PROJECT_ID,
        AGENT_SLUG,
      );
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
      const { service, prisma, collaboration } = createService();
      const source = buildAgentRow();
      const copy = buildAgentRow({
        slug: 'test-agent-copy',
        name: 'Test Agent (Copy)',
        enabled: false,
        isDefault: false,
      });
      prisma.projectAgent.findMany.mockResolvedValue([source]);
      prisma.project.findUnique.mockResolvedValue({
        collaborationEnabled: true,
        collaborationMemberSlugs: [AGENT_SLUG],
      });
      prisma.projectAgent.findUnique
        .mockResolvedValueOnce(source)
        .mockResolvedValueOnce(source)
        .mockResolvedValueOnce(null)
        .mockResolvedValue(copy)
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
      expect(collaboration.addMember).toHaveBeenCalledWith(
        PROJECT_ID,
        'test-agent-copy',
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

});
