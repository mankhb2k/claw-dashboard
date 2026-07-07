import { NotFoundException } from '@nestjs/common';

import { AgentApiKeysService } from './agent-api-keys.service';

jest.mock('@claw-dashboard/control-plane-core', () => ({
  generateAgentApiToken: jest.fn(() => ({
    token: 'sk-claw-testtoken1234567890abcdef',
    tokenHash: 'hash-test',
    tokenPrefix: 'sk-claw-testtoken',
  })),
}));

describe('AgentApiKeysService', () => {
  const prisma = {
    projectAgent: { findUnique: jest.fn() },
    projectAgentApiKey: {
      findMany: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const service = new AgentApiKeysService(prisma as never);

  const PROJECT_ID = 'proj-1';
  const AGENT_SLUG = 'sales-bot';
  const AGENT_ID = 'agent-row-1';

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.projectAgent.findUnique.mockResolvedValue({ id: AGENT_ID });
  });

  it('lists active keys for agent', async () => {
    prisma.projectAgentApiKey.findMany.mockResolvedValue([
      {
        id: 'key-1',
        label: 'CRM',
        tokenPrefix: 'sk-claw-abc',
        createdAt: new Date('2026-06-01T00:00:00.000Z'),
        lastUsedAt: null,
      },
    ]);

    const result = await service.list(PROJECT_ID, AGENT_SLUG);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.label).toBe('CRM');
    expect(prisma.projectAgentApiKey.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectAgentId: AGENT_ID, revokedAt: null },
      }),
    );
  });

  it('creates key and returns plaintext once', async () => {
    prisma.projectAgentApiKey.create.mockResolvedValue({
      id: 'key-new',
      label: 'Website',
      tokenPrefix: 'sk-claw-testtoken',
      createdAt: new Date('2026-06-02T00:00:00.000Z'),
      lastUsedAt: null,
    });

    const created = await service.create(PROJECT_ID, AGENT_SLUG, 'Website');

    expect(created.token).toBe('sk-claw-testtoken1234567890abcdef');
    expect(created.id).toBe('key-new');
  });

  it('revokes key scoped to agent', async () => {
    prisma.projectAgentApiKey.updateMany.mockResolvedValue({ count: 1 });

    await service.revoke(PROJECT_ID, AGENT_SLUG, 'key-1');

    expect(prisma.projectAgentApiKey.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'key-1', projectAgentId: AGENT_ID, revokedAt: null },
      }),
    );
  });

  it('throws when agent missing', async () => {
    prisma.projectAgent.findUnique.mockResolvedValue(null);

    await expect(service.list(PROJECT_ID, AGENT_SLUG)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws when revoke misses key', async () => {
    prisma.projectAgentApiKey.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.revoke(PROJECT_ID, AGENT_SLUG, 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
