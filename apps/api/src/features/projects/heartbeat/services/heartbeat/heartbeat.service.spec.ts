import { BadRequestException, NotFoundException } from '@nestjs/common';

jest.mock('../../../workspace/services/workspace/workspace.service', () => ({
  WorkspaceService: class MockWorkspaceService {},
}));

import { HeartbeatService } from './heartbeat.service';

function createService() {
  const prisma = {
    project: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    projectAgent: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  const workspace = {
    syncProjectRuntime: jest.fn().mockResolvedValue(undefined),
  };
  const service = new HeartbeatService(prisma as never, workspace as never);
  return { service, prisma, workspace };
}

const PROJECT_ID = 'proj_1';

describe('HeartbeatService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateProjectHeartbeat', () => {
    it('rejects enable with 0m interval', async () => {
      const { service } = createService();
      await expect(
        service.updateProjectHeartbeat(PROJECT_ID, {
          enabled: true,
          every: '0m',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('updates project and syncs runtime', async () => {
      const { service, prisma, workspace } = createService();
      prisma.project.update.mockResolvedValue({});
      prisma.project.findUnique.mockResolvedValue({
        heartbeatEnabled: true,
        heartbeatEvery: '30m',
        heartbeatMd: '# checklist',
      });
      prisma.projectAgent.findMany.mockResolvedValue([]);

      const result = await service.updateProjectHeartbeat(PROJECT_ID, {
        enabled: true,
        every: '30m',
        heartbeatMd: '# checklist',
      });

      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            heartbeatEnabled: true,
            heartbeatEvery: '30m',
          }),
        }),
      );
      expect(workspace.syncProjectRuntime).toHaveBeenCalledWith(PROJECT_ID);
      expect(result.enabled).toBe(true);
    });
  });

  describe('updateAgentHeartbeat', () => {
    it('requires interval for custom mode', async () => {
      const { service, prisma } = createService();
      prisma.projectAgent.findUnique.mockResolvedValue({
        id: 'a1',
        slug: 'ops',
      });

      await expect(
        service.updateAgentHeartbeat(PROJECT_ID, 'ops', {
          mode: 'custom',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws when agent missing', async () => {
      const { service, prisma } = createService();
      prisma.projectAgent.findUnique.mockResolvedValue(null);

      await expect(
        service.updateAgentHeartbeat(PROJECT_ID, 'missing', { mode: 'off' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
