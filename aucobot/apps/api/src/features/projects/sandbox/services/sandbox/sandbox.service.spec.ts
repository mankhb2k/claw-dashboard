import { NotFoundException } from '@nestjs/common';

jest.mock('../../../workspace/services/workspace/workspace.service', () => ({
  WorkspaceService: class MockWorkspaceService {},
}));

jest.mock('@aucobot/workspace-sync', () => ({
  parseCollaborationMemberSlugs: (raw: unknown) =>
    Array.isArray(raw)
      ? raw.map((v) => String(v).trim().toLowerCase()).filter(Boolean)
      : [],
}));

import { SandboxService } from './sandbox.service';

const PROJECT_ID = 'proj_test_1';

const sampleAgents = [
  {
    slug: 'helper',
    name: 'Helper',
    avatar: '🤖',
    enabled: true,
  },
  {
    slug: 'writer',
    name: 'Writer',
    avatar: '✍️',
    enabled: false,
  },
];

const sampleProject = {
  sandboxDefaultEnabled: true,
  sandboxDefaultMode: 'all',
  sandboxExemptAgentSlugs: ['Helper'],
  sandboxAppliedAgentSlugs: [],
};

function createService() {
  const prisma = {
    project: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
    projectAgent: {
      findMany: jest.fn(),
    },
  };
  const workspace = {
    syncProjectRuntime: jest.fn().mockResolvedValue(undefined),
  };
  const service = new SandboxService(prisma as never, workspace as never);
  return { service, prisma, workspace };
}

describe('SandboxService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProjectSandbox', () => {
    it('returns sandbox settings with main agent prepended', async () => {
      const { service, prisma } = createService();
      prisma.project.findUnique.mockResolvedValue(sampleProject);
      prisma.projectAgent.findMany.mockResolvedValue(sampleAgents);

      const result = await service.getProjectSandbox(PROJECT_ID);

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: PROJECT_ID },
        select: {
          sandboxDefaultEnabled: true,
          sandboxDefaultMode: true,
          sandboxExemptAgentSlugs: true,
          sandboxAppliedAgentSlugs: true,
        },
      });
      expect(result).toEqual({
        enabled: true,
        mode: 'all',
        exemptAgentSlugs: ['helper'],
        appliedAgentSlugs: [],
        agents: [
          { slug: 'main', name: 'Main', avatar: '🦞', enabled: true },
          ...sampleAgents,
        ],
      });
    });

    it('throws when project is missing', async () => {
      const { service, prisma } = createService();
      prisma.project.findUnique.mockResolvedValue(null);
      prisma.projectAgent.findMany.mockResolvedValue([]);

      await expect(
        service.getProjectSandbox(PROJECT_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('normalizes legacy non-main mode to selected', async () => {
      const { service, prisma } = createService();
      prisma.project.findUnique.mockResolvedValue({
        ...sampleProject,
        sandboxDefaultMode: 'non-main',
        sandboxAppliedAgentSlugs: ['helper'],
      });
      prisma.projectAgent.findMany.mockResolvedValue(sampleAgents);

      const result = await service.getProjectSandbox(PROJECT_ID);

      expect(result.mode).toBe('selected');
      expect(result.appliedAgentSlugs).toEqual(['helper']);
    });

    it('fills applied agents from enabled custom agents when selected mode has empty list', async () => {
      const { service, prisma } = createService();
      prisma.project.findUnique.mockResolvedValue({
        ...sampleProject,
        sandboxDefaultMode: 'selected',
        sandboxAppliedAgentSlugs: [],
      });
      prisma.projectAgent.findMany.mockResolvedValue(sampleAgents);

      const result = await service.getProjectSandbox(PROJECT_ID);

      expect(result.appliedAgentSlugs).toEqual(['helper']);
    });
  });

  describe('updateProjectSandbox', () => {
    it('persists all-mode settings, syncs runtime, and returns fresh state', async () => {
      const { service, prisma, workspace } = createService();
      prisma.project.update.mockResolvedValue({});
      prisma.project.findUnique.mockResolvedValue({
        sandboxDefaultEnabled: false,
        sandboxDefaultMode: 'all',
        sandboxExemptAgentSlugs: ['helper'],
        sandboxAppliedAgentSlugs: [],
      });
      prisma.projectAgent.findMany.mockResolvedValue(sampleAgents);

      const result = await service.updateProjectSandbox(PROJECT_ID, {
        enabled: false,
        mode: 'all',
        exemptAgentSlugs: [' Helper ', 'helper', ''],
        appliedAgentSlugs: ['ignored'],
      });

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: PROJECT_ID },
        data: {
          sandboxDefaultEnabled: false,
          sandboxDefaultMode: 'all',
          sandboxExemptAgentSlugs: ['helper'],
          sandboxAppliedAgentSlugs: [],
        },
      });
      expect(workspace.syncProjectRuntime).toHaveBeenCalledWith(PROJECT_ID);
      expect(result).toMatchObject({
        enabled: false,
        mode: 'all',
        exemptAgentSlugs: ['helper'],
        appliedAgentSlugs: [],
      });
    });

    it('persists selected-mode applied slugs and clears exempt list', async () => {
      const { service, prisma, workspace } = createService();
      prisma.project.findUnique.mockResolvedValue({
        sandboxDefaultEnabled: true,
        sandboxDefaultMode: 'selected',
        sandboxExemptAgentSlugs: [],
        sandboxAppliedAgentSlugs: ['helper', 'writer'],
      });
      prisma.projectAgent.findMany.mockResolvedValue(sampleAgents);

      const result = await service.updateProjectSandbox(PROJECT_ID, {
        enabled: true,
        mode: 'selected',
        exemptAgentSlugs: ['main'],
        appliedAgentSlugs: [' Helper ', 'WRITER', 'helper'],
      });

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: PROJECT_ID },
        data: {
          sandboxDefaultEnabled: true,
          sandboxDefaultMode: 'selected',
          sandboxExemptAgentSlugs: [],
          sandboxAppliedAgentSlugs: ['helper', 'writer'],
        },
      });
      expect(workspace.syncProjectRuntime).toHaveBeenCalledWith(PROJECT_ID);
      expect(result).toMatchObject({
        enabled: true,
        mode: 'selected',
        exemptAgentSlugs: [],
        appliedAgentSlugs: ['helper', 'writer'],
      });
    });
  });
});
