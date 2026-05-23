import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Project, ProjectStatus } from '@prisma/client';
import { customAlphabet } from 'nanoid';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../core/database/prisma.service';
import { DockerService } from './docker/docker.service';
import { toProjectDto, type ProjectDto } from './projects.mapper';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectWorkspaceService } from './workspace/project-workspace.service';

const subdomainId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10);

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly docker: DockerService,
    private readonly workspace: ProjectWorkspaceService,
  ) {}

  async listMine(userId: string): Promise<ProjectDto[]> {
    const rows = await this.prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    const synced = await Promise.all(rows.map((p) => this.syncDockerState(p)));
    return synced.map((p) => toProjectDto(p));
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
      const gatewayToken = randomBytes(32).toString('base64url');
      const { syncPathHint, volumeName } = await this.workspace.bootstrapProjectWorkspace({
        projectId: project.id,
        gatewayToken,
      });

      const spawned = await this.docker.spawnWorker({
        subdomain,
        hostDataPath: syncPathHint,
        gatewayToken,
      });
      const updated = await this.prisma.project.update({
        where: { id: project.id },
        data: {
          status: ProjectStatus.RUNNING,
          containerName: spawned.containerName,
          containerId: spawned.containerId,
          hostPort: spawned.hostPort,
          gatewayToken,
          volumeName,
          syncPathHint,
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

  async respawn(userId: string, projectId: string): Promise<ProjectDto> {
    const project = await this.requireOwned(userId, projectId);
    const gatewayToken = project.gatewayToken ?? randomBytes(32).toString('base64url');
    await this.workspace.ensureGatewayConfigOnDisk(projectId, gatewayToken);
    const syncPathHint = await this.workspace.ensureProjectLayout(projectId);

    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: ProjectStatus.CREATING, errorMessage: null },
    });

    try {
      const spawned = await this.docker.spawnWorker({
        subdomain: project.subdomain,
        hostDataPath: syncPathHint,
        gatewayToken,
      });
      const updated = await this.prisma.project.update({
        where: { id: projectId },
        data: {
          status: ProjectStatus.RUNNING,
          containerName: spawned.containerName,
          containerId: spawned.containerId,
          hostPort: spawned.hostPort,
          gatewayToken,
          errorMessage: null,
          lastActiveAt: new Date(),
        },
      });
      return toProjectDto(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Respawn failed';
      const updated = await this.prisma.project.update({
        where: { id: projectId },
        data: { status: ProjectStatus.ERROR, errorMessage: message },
      });
      throw new BadRequestException(message);
    }
  }

  async start(userId: string, projectId: string): Promise<ProjectDto> {
    const project = await this.syncDockerState(await this.requireOwned(userId, projectId));
    if (!project.containerId) {
      throw new BadRequestException(
        'Container not found — use respawn to create a new container for this workspace.',
      );
    }
    const dockerState = await this.docker.syncRunning(project.containerId);
    if (dockerState === 'missing') {
      throw new BadRequestException(
        'Container not found — use respawn to create a new container for this workspace.',
      );
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
    const synced = await this.syncDockerState(await this.requireOwned(userId, projectId));
    const dto = toProjectDto(synced);
    return {
      status: dto.status,
      displayName: dto.displayName,
      publicUrl: dto.publicUrl,
      subdomain: dto.subdomain,
      lastActiveAt: dto.lastActiveAt,
      containerMissing: dto.containerMissing,
      errorMessage: dto.errorMessage,
    };
  }

  async assertOwned(userId: string, projectId: string) {
    return this.requireOwned(userId, projectId);
  }

  async getRuntimeForChat(userId: string, projectId: string) {
    const project = await this.syncDockerState(await this.requireOwned(userId, projectId));
    if (project.status !== ProjectStatus.RUNNING || !project.hostPort || !project.gatewayToken) {
      return {
        project,
        ready: false as const,
        reason: 'PROJECT_NOT_RUNNING' as const,
      };
    }
    return {
      project,
      ready: true as const,
      hostPort: project.hostPort,
      gatewayToken: project.gatewayToken,
    };
  }

  private async requireOwned(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  /** Đồng bộ trạng thái DB với Docker (container còn tồn tại hay đã xóa). */
  private async syncDockerState(project: Project): Promise<Project> {
    const live = await this.docker.resolveWorkerBySubdomain(project.subdomain);
    if (live?.running) {
      const needsLink =
        project.containerId !== live.containerId ||
        project.status !== ProjectStatus.RUNNING ||
        (live.hostPort > 0 && live.hostPort !== project.hostPort) ||
        project.errorMessage != null;
      if (needsLink) {
        return this.prisma.project.update({
          where: { id: project.id },
          data: {
            status: ProjectStatus.RUNNING,
            containerId: live.containerId,
            containerName: live.containerName,
            ...(live.hostPort > 0 ? { hostPort: live.hostPort } : {}),
            errorMessage: null,
            lastActiveAt: new Date(),
          },
        });
      }
      return project;
    }

    if (!project.containerId) {
      if (project.status === ProjectStatus.RUNNING) {
        return this.prisma.project.update({
          where: { id: project.id },
          data: {
            status: ProjectStatus.ERROR,
            errorMessage: 'Container not found',
          },
        });
      }
      return project;
    }

    const dockerState = await this.docker.syncRunning(project.containerId);
    if (dockerState === 'missing') {
      return this.prisma.project.update({
        where: { id: project.id },
        data: {
          status: ProjectStatus.ERROR,
          errorMessage: 'Container not found',
        },
      });
    }
    if (dockerState === 'running') {
      const livePort = await this.docker.getPublishedPort(project.containerId);
      const portChanged = livePort > 0 && livePort !== project.hostPort;
      const statusStale = project.status !== ProjectStatus.RUNNING;
      if (portChanged || statusStale) {
        return this.prisma.project.update({
          where: { id: project.id },
          data: {
            status: ProjectStatus.RUNNING,
            ...(portChanged ? { hostPort: livePort } : {}),
            errorMessage: null,
            lastActiveAt: new Date(),
          },
        });
      }
    }
    if (dockerState === 'stopped' && project.status === ProjectStatus.RUNNING) {
      return this.prisma.project.update({
        where: { id: project.id },
        data: { status: ProjectStatus.STOPPED, errorMessage: null },
      });
    }
    return project;
  }
}
