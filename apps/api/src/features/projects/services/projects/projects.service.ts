import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { customAlphabet } from 'nanoid';

import { PrismaService } from '../../../../core/database/prisma.service';
import { CreateProjectDto } from '../../dto/create.dto';
import { toProjectDto, type ProjectDto } from '../../projects.mapper';
import {
  resolveGatewayEndpoint,
  resolveOssGatewayToken,
} from '../../runtime/gateway-endpoint';
import { WorkspaceService } from '../../workspace/services/workspace/workspace.service';
import { gatewayTokenForNewProject } from '@claw-dashboard/control-plane-core';
import { ProjectStatus } from '@claw-dashboard/database';
import { StaticGatewayProvisioner } from '@claw-dashboard/runtime-oss';

const subdomainId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10);

const OSS_RUNTIME_ACTION_MSG =
  'OSS runtime uses a shared gateway container. Start or restart it with Docker (e.g. alpine/openclaw on port 18789), not per-project spawn.';

@Injectable()
export class ProjectsService {
  private readonly log = new Logger(ProjectsService.name);
  private readonly ossProvisioner = new StaticGatewayProvisioner(this.log);

  constructor(
    private readonly prisma: PrismaService,
    private readonly workspace: WorkspaceService,
  ) {}

  async listMine(userId: string): Promise<ProjectDto[]> {
    const rows = await this.prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((p) => toProjectDto(p));
  }

  async create(userId: string, dto: CreateProjectDto): Promise<ProjectDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.prisma.project.findUnique({
      where: { userId },
    });
    if (existing) {
      throw new ConflictException('User already has a project');
    }

    const displayName = this.resolveProjectDisplayName(dto.displayName, user);
    const subdomain = `p-${subdomainId()}`;
    const project = await this.prisma.project.create({
      data: {
        userId,
        displayName,
        subdomain,
        status: ProjectStatus.CREATING,
      },
    });

    try {
      const gatewayToken = gatewayTokenForNewProject();
      await this.ossProvisioner.provision(project.id, {
        gatewayToken,
        onBootstrap: async (projectId, token) => {
          await this.workspace.bootstrapProjectWorkspace({
            projectId,
            gatewayToken: token,
          });
        },
      });

      const updated = await this.prisma.project.update({
        where: { id: project.id },
        data: {
          status: ProjectStatus.RUNNING,
          gatewayToken,
          errorMessage: null,
          lastActiveAt: new Date(),
        },
      });
      return toProjectDto(updated);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Project provisioning failed';
      await this.prisma.project.update({
        where: { id: project.id },
        data: {
          status: ProjectStatus.ERROR,
          errorMessage: message,
        },
      });
      throw new BadRequestException(message);
    }
  }

  respawn(_userId: string, _projectId: string): Promise<ProjectDto> {
    throw new BadRequestException(OSS_RUNTIME_ACTION_MSG);
  }

  start(_userId: string, _projectId: string): Promise<ProjectDto> {
    throw new BadRequestException(OSS_RUNTIME_ACTION_MSG);
  }

  stop(_userId: string, _projectId: string): Promise<ProjectDto> {
    throw new BadRequestException(OSS_RUNTIME_ACTION_MSG);
  }

  async health(userId: string, projectId: string) {
    let project = await this.requireOwned(userId, projectId);
    project = await this.syncOssProjectFromGateway(project);
    const dto = toProjectDto(project);
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

  /** Reconcile DB status with shared gateway health (fixes stuck creating / stale running). */
  private async syncOssProjectFromGateway(
    project: Awaited<ReturnType<typeof this.requireOwned>>,
  ) {
    const canonicalToken = resolveOssGatewayToken(project.gatewayToken);
    await this.workspace.syncGatewayAuthToDisk(project.id, canonicalToken);

    const envToken = process.env.OPENCLAW_GATEWAY_TOKEN?.trim();
    let currentProject = project;
    if (envToken && currentProject.gatewayToken !== canonicalToken) {
      currentProject = await this.prisma.project.update({
        where: { id: currentProject.id },
        data: { gatewayToken: canonicalToken },
      });
    }

    const live = await this.ossProvisioner.getStatus({
      projectId: currentProject.id,
      mode: 'oss',
      gatewayToken: canonicalToken,
    });

    const gatewayDownMsg =
      'Gateway is not reachable on port 18789. Run Openclaw and match OPENCLAW_GATEWAY_TOKEN in apps/.env.';

    let nextStatus = currentProject.status;
    let errorMessage = currentProject.errorMessage;

    if (live === 'running') {
      if (currentProject.status !== ProjectStatus.RUNNING) {
        nextStatus = ProjectStatus.RUNNING;
        errorMessage = null;
      }
    } else if (
      currentProject.status === ProjectStatus.RUNNING ||
      currentProject.status === ProjectStatus.CREATING
    ) {
      nextStatus = ProjectStatus.ERROR;
      errorMessage = errorMessage?.trim() || gatewayDownMsg;
    }

    if (
      nextStatus === currentProject.status &&
      errorMessage === currentProject.errorMessage
    ) {
      return currentProject;
    }

    return this.prisma.project.update({
      where: { id: currentProject.id },
      data: {
        status: nextStatus,
        errorMessage,
        lastActiveAt:
          nextStatus === ProjectStatus.RUNNING
            ? new Date()
            : currentProject.lastActiveAt,
      },
    });
  }

  async assertOwned(userId: string, projectId: string) {
    return this.requireOwned(userId, projectId);
  }

  async getGatewayToken(
    userId: string,
    projectId: string,
  ): Promise<{ token: string }> {
    const project = await this.requireOwned(userId, projectId);
    return { token: resolveOssGatewayToken(project.gatewayToken) };
  }

  async getRuntimeForChat(userId: string, projectId: string) {
    const project = await this.requireOwned(userId, projectId);

    if (project.status !== ProjectStatus.RUNNING) {
      return {
        project,
        ready: false as const,
        reason: 'PROJECT_NOT_RUNNING' as const,
      };
    }

    if (!project.gatewayToken && !process.env.OPENCLAW_GATEWAY_TOKEN?.trim()) {
      return {
        project,
        ready: false as const,
        reason: 'GATEWAY_NOT_CONFIGURED' as const,
      };
    }

    try {
      const endpoint = resolveGatewayEndpoint(project);
      return {
        project,
        ready: true as const,
        gatewayWsUrl: endpoint.wsBaseUrl,
        gatewayToken: endpoint.token,
      };
    } catch {
      return {
        project,
        ready: false as const,
        reason: 'GATEWAY_NOT_CONFIGURED' as const,
      };
    }
  }

  private resolveProjectDisplayName(
    input: string | undefined,
    user: { name: string | null; username: string },
  ): string {
    const fromInput = input?.trim();
    if (fromInput) return fromInput;
    const fromName = user.name?.trim();
    if (fromName) return fromName;
    const fromUsername = user.username.trim();
    if (fromUsername) return fromUsername;
    return 'My workspace';
  }

  private async requireOwned(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }
}
