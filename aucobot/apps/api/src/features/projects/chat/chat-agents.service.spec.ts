import { readFile } from 'node:fs/promises';

jest.mock('../workspace/workspace.service', () => ({
  WorkspaceService: class MockWorkspaceService {},
}));

jest.mock('node:fs/promises', () => ({
  readFile: jest.fn(),
}));

import { ChatAgentsService } from './chat-agents.service';

const readFileMock = readFile as jest.MockedFunction<typeof readFile>;
const PROJECT_ID = 'proj_test_1';
const DATA_DIR = '/data/proj_test_1';

function createService() {
  const prisma = {
    projectAgent: {
      findMany: jest.fn(),
    },
  };
  const workspace = {
    resolveProjectDataDir: jest.fn().mockReturnValue(DATA_DIR),
  };
  const service = new ChatAgentsService(prisma as never, workspace as never);
  return { service, prisma, workspace };
}

describe('ChatAgentsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listAgentsForProject', () => {
    it('returns main plus enabled db agents with default flags', async () => {
      const { service, prisma } = createService();
      prisma.projectAgent.findMany.mockResolvedValue([
        { slug: 'support', name: 'Support', isDefault: true },
        { slug: 'sales', name: 'Sales', isDefault: false },
      ]);

      const agents = await service.listAgentsForProject(PROJECT_ID);

      expect(prisma.projectAgent.findMany).toHaveBeenCalledWith({
        where: { projectId: PROJECT_ID, enabled: true },
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      });
      expect(agents).toEqual([
        { id: 'main', name: 'Main', isDefault: false },
        { id: 'support', name: 'Support', isDefault: true },
        { id: 'sales', name: 'Sales', isDefault: false },
      ]);
      expect(readFileMock).not.toHaveBeenCalled();
    });

    it('marks main as default when no db agent is default', async () => {
      const { service, prisma } = createService();
      prisma.projectAgent.findMany.mockResolvedValue([
        { slug: 'support', name: 'Support', isDefault: false },
      ]);

      const agents = await service.listAgentsForProject(PROJECT_ID);

      expect(agents[0]).toEqual({ id: 'main', name: 'Main', isDefault: true });
      expect(agents[1]).toEqual({ id: 'support', name: 'Support', isDefault: false });
    });

    it('falls back to openclaw.json agents.list when db has no agents', async () => {
      const { service, prisma } = createService();
      prisma.projectAgent.findMany.mockResolvedValue([]);
      readFileMock.mockResolvedValue(
        JSON.stringify({
          agents: {
            list: [
              { id: 'alpha', name: 'Alpha' },
              { id: 'beta', name: 'Beta' },
            ],
          },
        }),
      );

      const agents = await service.listAgentsForProject(PROJECT_ID);

      expect(readFileMock).toHaveBeenCalledWith(
        expect.stringMatching(/openclaw\.json$/),
        'utf8',
      );
      expect(agents).toEqual([
        { id: 'alpha', name: 'Alpha', isDefault: true },
        { id: 'beta', name: 'Beta', isDefault: false },
      ]);
    });

    it('returns main only when db and disk are empty', async () => {
      const { service, prisma } = createService();
      prisma.projectAgent.findMany.mockResolvedValue([]);
      readFileMock.mockRejectedValue(new Error('ENOENT'));

      const agents = await service.listAgentsForProject(PROJECT_ID);

      expect(agents).toEqual([{ id: 'main', name: 'Main', isDefault: true }]);
    });
  });
});
