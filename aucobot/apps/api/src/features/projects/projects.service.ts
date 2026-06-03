import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ProjectStatus } from '@aucobot/database';
import { customAlphabet } from 'nanoid';
import { PrismaService } from '../../core/database/prisma.service';
import { toProjectDto, type ProjectDto } from './projects.mapper';
import { CreateProjectDto } from './dto/create.dto';
import { WorkspaceService } from './workspace/workspace.service';
import {
  resolveGatewayEndpoint,
  resolveOssGatewayToken,
} from './runtime/gateway-endpoint';
import { gatewayTokenForNewProject } from '@aucobot/control-plane-core';
import { StaticGatewayProvisioner } from '@aucobot/runtime-oss';
import { isOssRuntime } from './runtime/runtime-mode';

const subdomainId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10);

const CLOUD_RUNTIME_MSG = 'Cloud runtime is not configured in this build';
const OSS_RUNTIME_ACTION_MSG =
  'OSS runtime uses a shared gateway container. Start or restart it with Docker (e.g. openclaw-worker on port 18789), not per-project spawn.';

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
    if (!isOssRuntime()) {
      throw new BadRequestException(CLOUD_RUNTIME_MSG);
    }

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
      const gatewayToken = gatewayTokenForNewProject();
      await this.ossProvisioner.provision(project.id, {
        gatewayToken,
        onBootstrap: async (projectId, token) => {
          await this.workspace.bootstrapProjectWorkspace({ projectId, gatewayToken: token });
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
      const message = err instanceof Error ? err.message : 'Project provisioning failed';
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

  async respawn(_userId: string, _projectId: string): Promise<ProjectDto> {
    throw new BadRequestException(
      isOssRuntime() ? OSS_RUNTIME_ACTION_MSG : CLOUD_RUNTIME_MSG,
    );
  }

  async start(_userId: string, _projectId: string): Promise<ProjectDto> {
    throw new BadRequestException(
      isOssRuntime() ? OSS_RUNTIME_ACTION_MSG : CLOUD_RUNTIME_MSG,
    );
  }

  async stop(_userId: string, _projectId: string): Promise<ProjectDto> {
    throw new BadRequestException(
      isOssRuntime() ? OSS_RUNTIME_ACTION_MSG : CLOUD_RUNTIME_MSG,
    );
  }

  async health(userId: string, projectId: string) {
    let project = await this.requireOwned(userId, projectId);
    if (isOssRuntime()) {
      project = await this.syncOssProjectFromGateway(project);
    }
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
    if (envToken && project.gatewayToken !== canonicalToken) {
      project = await this.prisma.project.update({
        where: { id: project.id },
        data: { gatewayToken: canonicalToken },
      });
    }

    const live = await this.ossProvisioner.getStatus({
      projectId: project.id,
      mode: 'oss',
      gatewayToken: canonicalToken,
    });

    const gatewayDownMsg =
      'Shared gateway is not reachable on port 18789. Run `pnpm dev:runtime` and match OPENCLAW_GATEWAY_TOKEN in aucobot/.env.';

    let nextStatus = project.status;
    let errorMessage = project.errorMessage;

    if (live === 'running') {
      if (project.status !== ProjectStatus.RUNNING) {
        nextStatus = ProjectStatus.RUNNING;
        errorMessage = null;
      }
    } else if (
      project.status === ProjectStatus.RUNNING ||
      project.status === ProjectStatus.CREATING
    ) {
      nextStatus = ProjectStatus.ERROR;
      errorMessage = errorMessage?.trim() || gatewayDownMsg;
    }

    if (nextStatus === project.status && errorMessage === project.errorMessage) {
      return project;
    }

    return this.prisma.project.update({
      where: { id: project.id },
      data: {
        status: nextStatus,
        errorMessage,
        lastActiveAt:
          nextStatus === ProjectStatus.RUNNING ? new Date() : project.lastActiveAt,
      },
    });
  }

  async assertOwned(userId: string, projectId: string) {
    return this.requireOwned(userId, projectId);
  }

  async getGatewayToken(userId: string, projectId: string): Promise<{ token: string }> {
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

  private async requireOwned(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }
}
