import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { WorkspaceService } from '../workspace/workspace.service';
import type { UpdateProjectSandboxDto } from './dto/sandbox.dto';

@Injectable()
export class SandboxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspace: WorkspaceService,
  ) {}

  async getProjectSandbox(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        sandboxDefaultEnabled: true,
        sandboxDefaultMode: true,
      },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return {
      enabled: project.sandboxDefaultEnabled,
      mode: project.sandboxDefaultMode === 'all' ? 'all' : 'non-main',
    };
  }

  async updateProjectSandbox(projectId: string, dto: UpdateProjectSandboxDto) {
    await this.prisma.project.update({
      where: { id: projectId },
      data: {
        sandboxDefaultEnabled: dto.enabled,
        sandboxDefaultMode: dto.mode,
      },
    });

    await this.workspace.syncProjectRuntime(projectId);
    return this.getProjectSandbox(projectId);
  }
}
