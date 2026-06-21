import { NotFoundException } from '@nestjs/common';

jest.mock('../../../workspace/services/workspace/workspace.service', () => ({
  WorkspaceService: class MockWorkspaceService {},
}));

jest.mock('@aucobot/workspace-sync', () => ({
  openClawConfigPath: jest.fn((dataDir: string) => `${dataDir}/openclaw.json`),
  readOpenClawConfigJson: jest.fn(),
  parseAgentFormData: jest.fn((formData: unknown) => formData),
}));

import { ExecPolicyService } from './exec-policy.service';
import {
  openClawConfigPath,
  parseAgentFormData,
  readOpenClawConfigJson,
} from '@aucobot/workspace-sync';

const PROJECT_ID = 'proj_test_1';

const readOpenClawConfigJsonMock =
  readOpenClawConfigJson as jest.MockedFunction<typeof readOpenClawConfigJson>;
const parseAgentFormDataMock = parseAgentFormData as jest.MockedFunction<
  typeof parseAgentFormData
>;

function createService() {
  const prisma = {
    project: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
    projectAgent: {
      findFirst: jest.fn(),
    },
  };
  const workspace = {
    resolveProjectDataDir: jest.fn().mockReturnValue(`/data/${PROJECT_ID}`),
    syncProjectRuntime: jest.fn().mockResolvedValue(undefined),
  };
  const service = new ExecPolicyService(prisma as never, workspace as never);
  return { service, prisma, workspace };
}

const factoryDefaultProject = {
  execAskPolicy: 'on-miss',
  execSafeBins: [],
  execTimeoutSec: 1800,
};

describe('ExecPolicyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    parseAgentFormDataMock.mockImplementation((formData) => formData as never);
  });

  describe('getProjectExecPolicy', () => {
    it('returns normalized askPolicy, safeBins, and timeoutSec', async () => {
      const { service, prisma } = createService();
      prisma.project.findUnique.mockResolvedValue({
        execAskPolicy: 'always',
        execSafeBins: [' Git ', 'git', 'CURL'],
        execTimeoutSec: 300,
      });

      const result = await service.getProjectExecPolicy(PROJECT_ID);

      expect(result).toEqual({
        askPolicy: 'always',
        safeBins: ['curl', 'git'],
        timeoutSec: 300,
      });
    });

    it('coerces invalid ask policy to on-miss', async () => {
      const { service, prisma } = createService();
      prisma.project.findUnique.mockResolvedValue({
        execAskPolicy: 'maybe',
        execSafeBins: null,
        execTimeoutSec: 1800,
      });

      const result = await service.getProjectExecPolicy(PROJECT_ID);

      expect(result.askPolicy).toBe('on-miss');
      expect(result.safeBins).toEqual([]);
    });

    it('throws NotFoundException when project is missing', async () => {
      const { service, prisma } = createService();
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(service.getProjectExecPolicy(PROJECT_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('resolveProjectExecPolicy', () => {
    it('maps DB fields to ProjectExecPolicy shape', () => {
      const { service } = createService();

      const policy = service.resolveProjectExecPolicy({
        execAskPolicy: 'off',
        execSafeBins: [' NPM ', 'npm'],
        execTimeoutSec: 600,
      });

      expect(policy).toEqual({
        ask: 'off',
        safeBins: ['npm'],
        timeoutSec: 600,
      });
    });
  });

  describe('updateProjectExecPolicy', () => {
    it('persists normalized values, syncs runtime, and returns updated policy', async () => {
      const { service, prisma, workspace } = createService();
      prisma.project.findUnique.mockResolvedValue({
        execAskPolicy: 'off',
        execSafeBins: ['git'],
        execTimeoutSec: 120,
      });

      const result = await service.updateProjectExecPolicy(PROJECT_ID, {
        askPolicy: 'off',
        safeBins: [' GIT ', 'git', ''],
        timeoutSec: 120,
      });

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: PROJECT_ID },
        data: {
          execAskPolicy: 'off',
          execSafeBins: ['git'],
          execTimeoutSec: 120,
        },
      });
      expect(workspace.syncProjectRuntime).toHaveBeenCalledWith(PROJECT_ID);
      expect(result).toEqual({
        askPolicy: 'off',
        safeBins: ['git'],
        timeoutSec: 120,
      });
    });
  });

  describe('maybeMigrateExecPolicyFromLegacy', () => {
    it('returns early when project is missing', async () => {
      const { service, prisma } = createService();
      prisma.project.findUnique.mockResolvedValue(null);

      await service.maybeMigrateExecPolicyFromLegacy(PROJECT_ID);

      expect(prisma.project.update).not.toHaveBeenCalled();
    });

    it('returns early when DB already has non-factory exec policy', async () => {
      const { service, prisma } = createService();
      prisma.project.findUnique.mockResolvedValue({
        execAskPolicy: 'always',
        execSafeBins: [],
        execTimeoutSec: 1800,
      });

      await service.maybeMigrateExecPolicyFromLegacy(PROJECT_ID);

      expect(readOpenClawConfigJsonMock).not.toHaveBeenCalled();
      expect(prisma.project.update).not.toHaveBeenCalled();
    });

    it('imports tools.exec from openclaw.json when DB has factory defaults', async () => {
      const { service, prisma, workspace } = createService();
      prisma.project.findUnique.mockResolvedValue(factoryDefaultProject);
      readOpenClawConfigJsonMock.mockResolvedValue({
        tools: {
          exec: {
            ask: 'always',
            safeBins: ['curl', 'wget'],
            timeoutSec: 900,
          },
        },
      });

      await service.maybeMigrateExecPolicyFromLegacy(PROJECT_ID);

      expect(openClawConfigPath).toHaveBeenCalledWith(`/data/${PROJECT_ID}`);
      expect(workspace.resolveProjectDataDir).toHaveBeenCalledWith(PROJECT_ID);
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: PROJECT_ID },
        data: {
          execAskPolicy: 'always',
          execSafeBins: ['curl', 'wget'],
          execTimeoutSec: 900,
        },
      });
      expect(prisma.projectAgent.findFirst).not.toHaveBeenCalled();
    });

    it('clamps timeoutSec from disk config to 5..86400', async () => {
      const { service, prisma } = createService();
      prisma.project.findUnique.mockResolvedValue(factoryDefaultProject);
      readOpenClawConfigJsonMock.mockResolvedValue({
        tools: {
          exec: {
            ask: 'off',
            safeBins: [],
            timeoutSec: 999_999,
          },
        },
      });

      await service.maybeMigrateExecPolicyFromLegacy(PROJECT_ID);

      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ execTimeoutSec: 86400 }),
        }),
      );
    });

    it('falls back to legacy agent formData when disk has no tools.exec', async () => {
      const { service, prisma } = createService();
      prisma.project.findUnique.mockResolvedValue(factoryDefaultProject);
      readOpenClawConfigJsonMock.mockResolvedValue({});
      prisma.projectAgent.findFirst.mockResolvedValue({
        formData: {
          name: 'Main',
          askPolicy: 'always',
          safeBins: ['node'],
          timeoutSec: 240,
        },
      });

      await service.maybeMigrateExecPolicyFromLegacy(PROJECT_ID);

      expect(parseAgentFormDataMock).toHaveBeenCalled();
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: PROJECT_ID },
        data: {
          execAskPolicy: 'always',
          execSafeBins: ['node'],
          execTimeoutSec: 240,
        },
      });
    });

    it('does not update when legacy formData matches factory defaults', async () => {
      const { service, prisma } = createService();
      prisma.project.findUnique.mockResolvedValue(factoryDefaultProject);
      readOpenClawConfigJsonMock.mockResolvedValue(null);
      prisma.projectAgent.findFirst.mockResolvedValue({
        formData: {
          name: 'Main',
          askPolicy: 'on-miss',
          safeBins: [],
          timeoutSec: 1800,
        },
      });

      await service.maybeMigrateExecPolicyFromLegacy(PROJECT_ID);

      expect(prisma.project.update).not.toHaveBeenCalled();
    });

    it('ignores invalid legacy formData', async () => {
      const { service, prisma } = createService();
      prisma.project.findUnique.mockResolvedValue(factoryDefaultProject);
      readOpenClawConfigJsonMock.mockResolvedValue(null);
      prisma.projectAgent.findFirst.mockResolvedValue({
        formData: { name: 'Main' },
      });
      parseAgentFormDataMock.mockImplementation(() => {
        throw new Error('invalid form');
      });

      await service.maybeMigrateExecPolicyFromLegacy(PROJECT_ID);

      expect(prisma.project.update).not.toHaveBeenCalled();
    });
  });
});
