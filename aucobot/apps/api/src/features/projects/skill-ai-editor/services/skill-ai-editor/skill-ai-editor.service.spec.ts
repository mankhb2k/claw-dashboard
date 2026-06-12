import { BadRequestException, NotFoundException } from '@nestjs/common';

const getSkillAiEditorAdapterMock = jest.fn();
const isSkillAiEditorProviderSupportedMock = jest.fn(
  (id: string) => id === 'openai' || id === 'gemini',
);

jest.mock('../../providers/skill-ai-editor-registry', () => ({
  getSkillAiEditorAdapter: (...args: unknown[]) => getSkillAiEditorAdapterMock(...args),
  isSkillAiEditorProviderSupported: (id: string) =>
    isSkillAiEditorProviderSupportedMock(id),
}));

jest.mock('@aucobot/control-plane-core', () => ({
  decryptSecret: (ciphertext: string) => ciphertext.replace(/^enc:/, ''),
}));

jest.mock('../../../usage/services/model-usage-recorder/model-usage-recorder.service', () => ({
  ModelUsageRecorderService: class MockModelUsageRecorderService {},
}));

import { SkillAiEditorService } from './skill-ai-editor.service';

const USER_ID = 'user_1';

function createService() {
  const prisma = {
    projectProviderKey: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };
  const usageRecorder = {
    recordFireAndForget: jest.fn(),
  };
  const service = new SkillAiEditorService(prisma as never, usageRecorder as never);
  return { service, prisma, usageRecorder };
}

const PROJECT_ID = 'proj_1';
const SKILL_CONTEXT = {
  slug: 'my-skill',
  name: 'My Skill',
  description: 'Does something useful',
};

describe('SkillAiEditorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSkillAiEditorAdapterMock.mockReturnValue({
      id: 'openai',
      complete: jest.fn().mockResolvedValue({
        markdown: '# Skill body',
        inputTokens: 10,
        outputTokens: 5,
        latencyMs: 100,
      }),
    });
  });

  it('listOptions skips unsupported providers', async () => {
    const { service, prisma } = createService();
    prisma.projectProviderKey.findMany.mockResolvedValue([
      { providerId: 'anthropic', enabled: true, lastTestOk: true },
      {
        providerId: 'openai',
        enabled: true,
        lastTestOk: true,
        defaultModel: 'openai/gpt-4o-mini',
      },
    ]);

    const result = await service.listOptions(PROJECT_ID);

    expect(result.providers).toHaveLength(1);
    expect(result.providers[0]?.providerId).toBe('openai');
  });

  it('rejects when adapter is missing', async () => {
    getSkillAiEditorAdapterMock.mockReturnValue(undefined);
    const { service } = createService();

    await expect(
      service.complete({
        userId: USER_ID,
        projectId: PROJECT_ID,
        providerId: 'openai',
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: 'Write skill' }],
        skillContext: SKILL_CONTEXT,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws NO_PROVIDER_KEY when key row is missing', async () => {
    const { service, prisma } = createService();
    prisma.projectProviderKey.findUnique.mockResolvedValue(null);

    await expect(
      service.complete({
        userId: USER_ID,
        projectId: PROJECT_ID,
        providerId: 'openai',
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: 'Write skill' }],
        skillContext: SKILL_CONTEXT,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns markdown from provider', async () => {
    const { service, prisma, usageRecorder } = createService();
    prisma.projectProviderKey.findUnique.mockResolvedValue({
      enabled: true,
      lastTestOk: true,
      ciphertext: 'enc:secret',
    });

    const result = await service.complete({
      userId: USER_ID,
      projectId: PROJECT_ID,
      providerId: 'openai',
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: 'Write skill' }],
      skillContext: SKILL_CONTEXT,
    });

    expect(result.markdown).toBe('# Skill body');
    expect(usageRecorder.recordFireAndForget).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: PROJECT_ID,
        userId: USER_ID,
        source: 'OTHER',
        status: 'SUCCESS',
      }),
    );
  });

  it('rejects markdown that exceeds max size', async () => {
    getSkillAiEditorAdapterMock.mockReturnValue({
      id: 'openai',
      complete: jest.fn().mockResolvedValue({
        markdown: 'x'.repeat(64_001),
        inputTokens: 1,
        outputTokens: 1,
        latencyMs: 1,
      }),
    });
    const { service, prisma } = createService();
    prisma.projectProviderKey.findUnique.mockResolvedValue({
      enabled: true,
      lastTestOk: true,
      ciphertext: 'enc:secret',
    });

    await expect(
      service.complete({
        userId: USER_ID,
        projectId: PROJECT_ID,
        providerId: 'openai',
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: 'Write skill' }],
        skillContext: SKILL_CONTEXT,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
