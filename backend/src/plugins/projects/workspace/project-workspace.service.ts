import { Injectable } from '@nestjs/common';
import { WorkspaceRevisionKind } from '@prisma/client';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PrismaService } from '../../../core/database/prisma.service';
import { buildInitialOpenClawConfig, type OpenClawProjectConfig } from './openclaw-config';

@Injectable()
export class ProjectWorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  /** Thư mục host bind-mount vào `/home/node/.openclaw` trong container. */
  resolveProjectDataDir(projectId: string): string {
    const root =
      process.env.OPENCLAW_DATA_ROOT?.trim() ||
      path.join(process.cwd(), 'data', 'projects');
    return path.resolve(root, projectId);
  }

  volumeNameFor(projectId: string): string {
    return `oc-vol-${projectId}`;
  }

  async ensureProjectLayout(projectId: string): Promise<string> {
    const dataDir = this.resolveProjectDataDir(projectId);
    await mkdir(path.join(dataDir, 'workspace'), { recursive: true });
    return dataDir;
  }

  async recordRevision(
    projectId: string,
    kind: WorkspaceRevisionKind,
    payload: unknown,
  ) {
    return this.prisma.workspaceRevision.create({
      data: {
        projectId,
        kind,
        payload: payload as object,
      },
    });
  }

  async syncOpenClawJsonToDisk(projectId: string, config: OpenClawProjectConfig): Promise<void> {
    const dataDir = await this.ensureProjectLayout(projectId);
    const configPath = path.join(dataDir, 'openclaw.json');
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  }

  /** Revision #1 + file trên disk trước khi spawn container. */
  async bootstrapProjectWorkspace(params: {
    projectId: string;
    gatewayToken: string;
  }): Promise<{ syncPathHint: string; volumeName: string }> {
    const config = buildInitialOpenClawConfig({ gatewayToken: params.gatewayToken });
    const syncPathHint = await this.ensureProjectLayout(params.projectId);
    await this.recordRevision(params.projectId, WorkspaceRevisionKind.OPENCLAW_JSON, config);
    await this.syncOpenClawJsonToDisk(params.projectId, config);
    return {
      syncPathHint,
      volumeName: this.volumeNameFor(params.projectId),
    };
  }
}
