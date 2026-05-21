import { Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ProjectWorkspaceService } from '../workspace/project-workspace.service';

export type ChatAgentSummary = {
  id: string;
  name: string;
  isDefault: boolean;
};

@Injectable()
export class ChatAgentsService {
  constructor(private readonly workspace: ProjectWorkspaceService) {}

  async listAgentsForProject(projectId: string): Promise<ChatAgentSummary[]> {
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
      /* use fallback */
    }
    return [{ id: 'main', name: 'Main', isDefault: true }];
  }
}
