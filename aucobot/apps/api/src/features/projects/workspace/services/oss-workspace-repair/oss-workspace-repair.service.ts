import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ProjectStatus } from '@aucobot/database';

import { PrismaService } from '../../../../../core/database/prisma.service';
import { isOssRuntime } from '../../../runtime/runtime-mode';
import { WorkspaceService } from '../workspace/workspace.service';

/**
 * On API boot (OSS): repair empty main workspaces + stale gateway attestations,
 * then re-sync openclaw.json so desktop bundle users can chat without manual steps.
 */
@Injectable()
export class OssWorkspaceRepairService implements OnModuleInit {
  private readonly log = new Logger(OssWorkspaceRepairService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly workspace: WorkspaceService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!isOssRuntime()) return;

    const projects = await this.prisma.project.findMany({
      where: {
        status: { in: [ProjectStatus.RUNNING, ProjectStatus.CREATING] },
      },
      select: { id: true },
    });

    for (const project of projects) {
      try {
        await this.workspace.syncProjectRuntime(project.id);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.log.warn(
          `[oss-workspace] repair/sync skipped for project ${project.id}: ${message}`,
        );
      }
    }
  }
}
