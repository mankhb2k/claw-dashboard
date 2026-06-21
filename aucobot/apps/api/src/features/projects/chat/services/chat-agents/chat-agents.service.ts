import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../../core/database/prisma.service';
import { WorkspaceService } from '../../../workspace/services/workspace/workspace.service';

import type { ChatAgentSummary } from '../../lib/chat.types';

export type { ChatAgentSummary } from '../../lib/chat.types';

@Injectable()
export class ChatAgentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspace: WorkspaceService,
  ) {}

  async listAgentsForProject(projectId: string): Promise<ChatAgentSummary[]> {
    const userAgents = await this.prisma.projectAgent.findMany({
      where: { projectId, enabled: true },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    if (userAgents.length > 0) {
      const hasUserDefault = userAgents.some((a) => a.isDefault);
      return [
        {
          id: 'main',
          name: 'Main',
          isDefault: !hasUserDefault,
        },
        ...userAgents.map((row) => ({
          id: row.slug,
          name: row.name,
          isDefault: row.isDefault,
        })),
      ];
    }

    const dataDir = this.workspace.resolveProjectDataDir(projectId);
    const configPath = path.join(dataDir, 'openclaw.json');
    try {
      const raw = await readFile(configPath, 'utf8');
      const parsed = JSON.parse(raw) as {
        agents?: { list?: Array<{ id?: string; name?: string }> };
      };
      const list = parsed.agents?.list;
      if (Array.isArray(list) && list.length > 0) {
        return list
          .map((row) => ({
            id: String(row.id ?? 'main').trim() || 'main',
            name: String(row.name ?? row.id ?? 'main').trim() || 'main',
            isDefault: false,
          }))
          .map((row, idx) => ({ ...row, isDefault: idx === 0 }));
      }
    } catch {
      /* fallback */
    }

    return [{ id: 'main', name: 'Main', isDefault: true }];
  }
}
