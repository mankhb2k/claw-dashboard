import { Injectable, NotFoundException } from '@nestjs/common';
import { generateAgentApiToken } from '@aucobot/control-plane-core';
import { PrismaService } from '../../../../../core/database/prisma.service';
import { validateAgentSlug } from '../../lib/agent-slug';

export type AgentApiKeyListItem = {
  id: string;
  label: string;
  tokenPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
};

export type AgentApiKeyCreated = AgentApiKeyListItem & {
  token: string;
};

@Injectable()
export class AgentApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  private async findAgent(projectId: string, slug: string) {
    const safeSlug = validateAgentSlug(slug);
    const row = await this.prisma.projectAgent.findUnique({
      where: { projectId_slug: { projectId, slug: safeSlug } },
      select: { id: true },
    });
    if (!row) {
      throw new NotFoundException('Agent not found');
    }
    return row;
  }

  async list(projectId: string, agentSlug: string): Promise<{ items: AgentApiKeyListItem[] }> {
    const agent = await this.findAgent(projectId, agentSlug);
    const rows = await this.prisma.projectAgentApiKey.findMany({
      where: { projectAgentId: agent.id, revokedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        label: true,
        tokenPrefix: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });
    return {
      items: rows.map((row) => ({
        id: row.id,
        label: row.label,
        tokenPrefix: row.tokenPrefix,
        createdAt: row.createdAt.toISOString(),
        lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
      })),
    };
  }

  async create(
    projectId: string,
    agentSlug: string,
    label: string,
  ): Promise<AgentApiKeyCreated> {
    const agent = await this.findAgent(projectId, agentSlug);
    const trimmedLabel = label.trim();
    const { token, tokenHash, tokenPrefix } = generateAgentApiToken();

    const row = await this.prisma.projectAgentApiKey.create({
      data: {
        projectAgentId: agent.id,
        label: trimmedLabel,
        tokenPrefix,
        tokenHash,
      },
      select: {
        id: true,
        label: true,
        tokenPrefix: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });

    return {
      id: row.id,
      label: row.label,
      tokenPrefix: row.tokenPrefix,
      createdAt: row.createdAt.toISOString(),
      lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
      token,
    };
  }

  async revoke(projectId: string, agentSlug: string, keyId: string): Promise<void> {
    const agent = await this.findAgent(projectId, agentSlug);
    const result = await this.prisma.projectAgentApiKey.updateMany({
      where: {
        id: keyId,
        projectAgentId: agent.id,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
    if (result.count === 0) {
      throw new NotFoundException('API key not found');
    }
  }
}
