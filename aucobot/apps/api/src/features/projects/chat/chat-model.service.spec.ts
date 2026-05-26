import { BadRequestException, NotFoundException } from '@nestjs/common';
import { readOpenClawConfigJson } from '@aucobot/workspace-sync';

jest.mock('../workspace/workspace.service', () => ({
  WorkspaceService: class MockWorkspaceService {},
}));

jest.mock('../agents/agent.service', () => ({
  AgentService: class MockAgentService {},
}));

jest.mock('../ai-providers/provider-keys.service', () => ({
  ProviderKeysService: class MockProviderKeysService {},
}));

jest.mock('@aucobot/workspace-sync', () => ({
  readOpenClawConfigJson: jest.fn(),
  parseAgentFormData: jest.fn((formData: unknown) =>
    typeof formData === 'object' && formData !== null ? { ...(formData as object) } : {},
  ),
}));

const readOpenClawConfigJsonMock = readOpenClawConfigJson as jest.MockedFunction<
  typeof readOpenClawConfigJson
>;

import { ChatModelService } from './chat-model.service';

const PROJECT_ID = 'proj_test_1';
const DATA_DIR = '/data/proj_test_1';

function createService() {
  const prisma = {
    projectProviderKey: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };
  const workspace = {
    resolveProjectDataDir: jest.fn().mockReturnValue(DATA_DIR),
  };
  const providerKeys = {
    setDefaultModel: jest.fn().mockResolvedValue(undefined),
  };
  const agents = {
    get: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
  };
  const service = new ChatModelService(
    prisma as never,
    workspace as never,
    providerKeys as never,
    agents as never,
  );
  return { service, prisma, workspace, providerKeys, agents };
}

describe('ChatModelService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    readOpenClawConfigJsonMock.mockResolvedValue({
      agents: { defaults: { model: { primary: 'google/gemini-2.5-flash' } } },
    });
  });

  describe('resolveProviderIdForOpenClawModel', () => {
    it('maps google/ and gemini- prefixes to gemini', () => {
      const { service } = createService();
      expect(service.resolveProviderIdForOpenClawModel('google/gemini-2.5-flash')).toBe(
        'gemini',
      );
      expect(service.resolveProviderIdForOpenClawModel('gemini-2.5-pro')).toBe('gemini');
    });

    it('maps gpt- and o-series ids to openai', () => {
      const { service } = createService();
      expect(service.resolveProviderIdForOpenClawModel('openai/gpt-4o')).toBe('openai');
      expect(service.resolveProviderIdForOpenClawModel('o3-mini')).toBe('openai');
    });

    it('throws for unknown model ids', () => {
      const { service } = createService();
      expect(() => service.resolveProviderIdForOpenClawModel('unknown-model')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('listModels', () => {
    it('returns enabled providers with catalogs and primaryModel from config', async () => {
      const { service, prisma } = createService();
      prisma.projectProviderKey.findMany.mockResolvedValue([
        {
          providerId: 'gemini',
          defaultModel: 'google/gemini-2.5-flash',
          lastTestOk: true,
          updatedAt: new Date(),
        },
      ]);

      const result = await service.listModels(PROJECT_ID);

      expect(result.primaryModel).toBe('google/gemini-2.5-flash');
      expect(result.providers).toHaveLength(1);
      expect(result.providers[0]).toMatchObject({
        providerId: 'gemini',
        displayName: 'Google Gemini',
        tested: true,
      });
      expect(result.providers[0].defaultModel).toBeTruthy();
      expect(result.providers[0].models.length).toBeGreaterThan(0);
    });

    it('skips unknown provider ids in db', async () => {
      const { service, prisma } = createService();
      prisma.projectProviderKey.findMany.mockResolvedValue([
        { providerId: 'not-in-registry', defaultModel: null, lastTestOk: false },
      ]);

      const result = await service.listModels(PROJECT_ID);

      expect(result.providers).toHaveLength(0);
    });
  });

  describe('setModel', () => {
    it('rejects empty model', async () => {
      const { service } = createService();
      await expect(
        service.setModel({ projectId: PROJECT_ID, agentId: 'main', model: '  ' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when provider key is not enabled', async () => {
      const { service, prisma } = createService();
      prisma.projectProviderKey.findUnique.mockResolvedValue({
        enabled: false,
        providerId: 'gemini',
      });

      await expect(
        service.setModel({
          projectId: PROJECT_ID,
          agentId: 'main',
          model: 'google/gemini-2.5-flash',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('sets default model for main agent via provider keys', async () => {
      const { service, prisma, providerKeys } = createService();
      prisma.projectProviderKey.findUnique.mockResolvedValue({ enabled: true });
      prisma.projectProviderKey.findMany.mockResolvedValue([
        {
          providerId: 'gemini',
          defaultModel: 'google/gemini-2.5-pro',
          lastTestOk: true,
        },
      ]);

      const result = await service.setModel({
        projectId: PROJECT_ID,
        agentId: 'main',
        model: 'google/gemini-2.5-pro',
      });

      expect(providerKeys.setDefaultModel).toHaveBeenCalledWith(
        PROJECT_ID,
        'gemini',
        'google/gemini-2.5-pro',
      );
      expect(result.model).toBe('google/gemini-2.5-pro');
    });

    it('updates custom agent formData and provider default model', async () => {
      const { service, prisma, providerKeys, agents } = createService();
      prisma.projectProviderKey.findUnique.mockResolvedValue({ enabled: true });
      prisma.projectProviderKey.findMany.mockResolvedValue([
        {
          providerId: 'openai',
          defaultModel: 'openai/gpt-4o',
          lastTestOk: true,
        },
      ]);
      agents.get.mockResolvedValue({
        slug: 'support',
        formData: { model: 'google/gemini-2.5-flash' },
      });

      await service.setModel({
        projectId: PROJECT_ID,
        agentId: 'support',
        model: 'openai/gpt-4o',
      });

      expect(agents.update).toHaveBeenCalledWith(PROJECT_ID, 'support', {
        formData: expect.objectContaining({ model: 'openai/gpt-4o' }),
      });
      expect(providerKeys.setDefaultModel).toHaveBeenCalledWith(
        PROJECT_ID,
        'openai',
        'openai/gpt-4o',
      );
    });

    it('throws when custom agent does not exist', async () => {
      const { service, prisma, agents } = createService();
      prisma.projectProviderKey.findUnique.mockResolvedValue({ enabled: true });
      agents.get.mockRejectedValue(new NotFoundException());

      await expect(
        service.setModel({
          projectId: PROJECT_ID,
          agentId: 'missing',
          model: 'openai/gpt-4o',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
