import { BadRequestException, NotFoundException } from '@nestjs/common';

const getAgentAiEditorAdapterMock = jest.fn();
const isAgentAiEditorProviderSupportedMock = jest.fn(
  (id: string) => id === 'openai' || id === 'gemini',
);

jest.mock('../../providers/agent-ai-editor-registry', () => ({
  getAgentAiEditorAdapter: (...args: unknown[]) => getAgentAiEditorAdapterMock(...args),
  isAgentAiEditorProviderSupported: (id: string) =>
    isAgentAiEditorProviderSupportedMock(id),
}));

jest.mock('@aucobot/control-plane-core', () => ({
  decryptSecret: (ciphertext: string) => ciphertext.replace(/^enc:/, ''),
}));

jest.mock('../../../usage/services/model-usage-recorder/model-usage-recorder.service', () => ({
  ModelUsageRecorderService: class MockModelUsageRecorderService {},
}));

import { AgentAiEditorService } from './agent-ai-editor.service';

const USER_ID = 'user_1';

function createService() {
  const prisma = {
    projectProviderKey: {
      findUnique: jest.fn(),
    },
  };
  const usageRecorder = {
    recordFireAndForget: jest.fn(),
  };
  const service = new AgentAiEditorService(prisma as never, usageRecorder as never);
  return { service, prisma, usageRecorder };
}

const PROJECT_ID = 'proj_1';
const AGENT_CONTEXT = {
  name: 'Helper',
  description: 'A helper agent',
  vibe: 'friendly',
  tags: ['support'],
  instructionsMode: 'simple' as const,
  currentAgentsMd: '# Role\nYou help users.',
};

describe('AgentAiEditorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAgentAiEditorAdapterMock.mockReturnValue({
      id: 'openai',
      complete: jest.fn().mockResolvedValue({
        text: JSON.stringify({
          phase: 'clarify',
          message: 'Tell me more',
          questions: ['Who is the audience?'],
        }),
        inputTokens: 12,
        outputTokens: 8,
        latencyMs: 100,
      }),
    });
  });

  it('rejects when adapter is missing', async () => {
    getAgentAiEditorAdapterMock.mockReturnValue(undefined);
    const { service } = createService();

    await expect(
      service.complete({
        userId: USER_ID,
        projectId: PROJECT_ID,
        providerId: 'openai',
        model: 'openai/gpt-4o-mini',
        intent: 'chat',
        messages: [{ role: 'user', content: 'Hi' }],
        agentContext: AGENT_CONTEXT,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects empty messages', async () => {
    const { service } = createService();

    await expect(
      service.complete({
        userId: USER_ID,
        projectId: PROJECT_ID,
        providerId: 'openai',
        model: 'openai/gpt-4o-mini',
        intent: 'chat',
        messages: [],
        agentContext: AGENT_CONTEXT,
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
        intent: 'chat',
        messages: [{ role: 'user', content: 'Hi' }],
        agentContext: AGENT_CONTEXT,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns parsed clarify result from provider', async () => {
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
      intent: 'chat',
      messages: [{ role: 'user', content: 'Hi' }],
      agentContext: AGENT_CONTEXT,
    });

    expect(result.phase).toBe('clarify');
    expect(result.message).toBe('Tell me more');
    expect(result.questions).toEqual(['Who is the audience?']);
    expect(usageRecorder.recordFireAndForget).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: USER_ID,
        source: 'OTHER',
        status: 'SUCCESS',
        inputTokens: 12,
        outputTokens: 8,
      }),
    );
  });

  it('rejects optimize markdown that exceeds max size', async () => {
    getAgentAiEditorAdapterMock.mockReturnValue({
      id: 'openai',
      complete: jest.fn().mockResolvedValue({
        text: JSON.stringify({
          phase: 'optimize',
          message: 'Done',
          markdown: 'x'.repeat(12_001),
        }),
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
        intent: 'optimize',
        messages: [{ role: 'user', content: 'Optimize' }],
        agentContext: AGENT_CONTEXT,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
