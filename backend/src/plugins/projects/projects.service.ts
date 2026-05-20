import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectStatus } from '@prisma/client';
import { customAlphabet } from 'nanoid';
import { PrismaService } from '../../core/database/prisma.service';
import { DockerService } from './docker/docker.service';
import { toProjectDto, type ProjectDto } from './projects.mapper';
import { CreateProjectDto } from './dto/create-project.dto';

const subdomainId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10);

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly docker: DockerService,
  ) {}

  async listMine(userId: string): Promise<ProjectDto[]> {
    const rows = await this.prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((p) => toProjectDto(p));
  }

  async create(userId: string, dto: CreateProjectDto): Promise<ProjectDto> {
    const existing = await this.prisma.project.findUnique({ where: { userId } });
    if (existing) {
      throw new ConflictException('User already has a project');
    }

    const subdomain = `p-${subdomainId()}`;
    const project = await this.prisma.project.create({
      data: {
        userId,
        displayName: dto.displayName.trim(),
        subdomain,
        status: ProjectStatus.CREATING,
      },
    });

    try {
      const spawned = await this.docker.spawnWorker(subdomain);
      const updated = await this.prisma.project.update({
        where: { id: project.id },
        data: {
          status: ProjectStatus.RUNNING,
          containerName: spawned.containerName,
          containerId: spawned.containerId,
          hostPort: spawned.hostPort,
          gatewayToken: spawned.gatewayToken,
          errorMessage: null,
          lastActiveAt: new Date(),
        },
      });
      return toProjectDto(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Docker spawn failed';
      const updated = await this.prisma.project.update({
        where: { id: project.id },
        data: {
          status: ProjectStatus.ERROR,
          errorMessage: message,
        },
      });
      throw new BadRequestException(message);
    }
  }

  async start(userId: string, projectId: string): Promise<ProjectDto> {
    const project = await this.requireOwned(userId, projectId);
    if (!project.containerId) {
      throw new BadRequestException('No container to start');
    }

    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: ProjectStatus.STARTING, errorMessage: null },
    });

    try {
      const hostPort = await this.docker.startContainer(project.containerId);
      const updated = await this.prisma.project.update({
        where: { id: projectId },
        data: {
          status: ProjectStatus.RUNNING,
          hostPort: hostPort || project.hostPort,
          lastActiveAt: new Date(),
        },
      });
      return toProjectDto(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Start failed';
      await this.prisma.project.update({
        where: { id: projectId },
        data: { status: ProjectStatus.ERROR, errorMessage: message },
      });
      throw new BadRequestException(message);
    }
  }

  async stop(userId: string, projectId: string): Promise<ProjectDto> {
    const project = await this.requireOwned(userId, projectId);
    if (!project.containerId) {
      throw new BadRequestException('No container to stop');
    }
    await this.docker.stopContainer(project.containerId);
    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: { status: ProjectStatus.STOPPED, lastActiveAt: new Date() },
    });
    return toProjectDto(updated);
  }

  async health(userId: string, projectId: string) {
    const project = await this.requireOwned(userId, projectId);
    let status = project.status;
    let hostPort = project.hostPort;

    if (project.containerId) {
      const dockerState = await this.docker.syncRunning(project.containerId);
      if (dockerState === 'missing') {
        status = ProjectStatus.ERROR;
        await this.prisma.project.update({
          where: { id: projectId },
          data: {
            status: ProjectStatus.ERROR,
            errorMessage: 'Container not found',
          },
        });
      } else if (dockerState === 'running' && status !== ProjectStatus.RUNNING) {
        status = ProjectStatus.RUNNING;
        await this.prisma.project.update({
          where: { id: projectId },
          data: { status: ProjectStatus.RUNNING, lastActiveAt: new Date() },
        });
      } else if (dockerState === 'stopped' && status === ProjectStatus.RUNNING) {
        status = ProjectStatus.STOPPED;
        await this.prisma.project.update({
          where: { id: projectId },
          data: { status: ProjectStatus.STOPPED },
        });
      }
    }

    const dto = toProjectDto({ ...project, status, hostPort });
    return {
      status: dto.status,
      displayName: dto.displayName,
      publicUrl: dto.publicUrl,
      subdomain: dto.subdomain,
      lastActiveAt: dto.lastActiveAt,
    };
  }

  private async requireOwned(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }
}
