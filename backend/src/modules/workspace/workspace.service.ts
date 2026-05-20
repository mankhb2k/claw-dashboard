import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { SaveWorkspaceDto } from './dto/save-workspace.dto';

@Injectable()
export class WorkspaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
  ) {}

  async saveRevision(userId: string, projectId: string, dto: SaveWorkspaceDto) {
    await this.projects.assertProjectOwned(projectId, userId);
    const last = await this.prisma.workspaceRevision.findFirst({
      where: { projectId },
      orderBy: { sequence: 'desc' },
      select: { sequence: true },
    });
    const sequence = (last?.sequence ?? 0) + 1;
    return this.prisma.workspaceRevision.create({
      data: {
        projectId,
        sequence,
        filesJson: dto.files as Prisma.InputJsonValue,
      },
    });
  }

  async getLatest(userId: string, projectId: string) {
    await this.projects.assertProjectOwned(projectId, userId);
    return this.prisma.workspaceRevision.findFirst({
      where: { projectId },
      orderBy: { sequence: 'desc' },
    });
  }

  async listRevisions(userId: string, projectId: string, take = 20) {
    await this.projects.assertProjectOwned(projectId, userId);
    return this.prisma.workspaceRevision.findMany({
      where: { projectId },
      orderBy: { sequence: 'desc' },
      take,
      select: {
        id: true,
        sequence: true,
        createdAt: true,
      },
    });
  }
}
