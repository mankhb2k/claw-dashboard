import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  buildHeartbeatSummary,
  parseHeartbeatMode,
  resolveAgentHeartbeatEvery,
  resolveMainHeartbeatEvery,
  validateHeartbeatEvery,
} from '@aucobot/workspace-sync';
import { PrismaService } from '../../../../../core/database/prisma.service';
import { WorkspaceService } from '../../../workspace/services/workspace/workspace.service';
import type {
  UpdateAgentHeartbeatDto,
  UpdateProjectHeartbeatDto,
} from '../../dto/heartbeat.dto';

@Injectable()
export class HeartbeatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspace: WorkspaceService,
  ) {}

  private async loadProjectHeartbeat(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        heartbeatEnabled: true,
        heartbeatEvery: true,
        heartbeatMd: true,
      },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async getProjectHeartbeat(projectId: string) {
    const project = await this.loadProjectHeartbeat(projectId);
    const agents = await this.prisma.projectAgent.findMany({
      where: { projectId },
      select: {
        slug: true,
        name: true,
        enabled: true,
        heartbeatMode: true,
        heartbeatEvery: true,
        heartbeatMd: true,
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    const every = project.heartbeatEnabled
      ? resolveMainHeartbeatEvery({
          heartbeatEnabled: project.heartbeatEnabled,
          heartbeatEvery: project.heartbeatEvery,
          heartbeatMd: project.heartbeatMd,
        })
      : null;

    return {
      enabled: project.heartbeatEnabled,
      every: project.heartbeatEvery,
      heartbeatMd: project.heartbeatMd,
      effectiveEvery: every,
      agents: buildHeartbeatSummary(
        {
          heartbeatEnabled: project.heartbeatEnabled,
          heartbeatEvery: project.heartbeatEvery,
          heartbeatMd: project.heartbeatMd,
        },
        agents.map((row) => ({
          slug: row.slug,
          name: row.name,
          enabled: row.enabled,
          heartbeatMode: row.heartbeatMode,
          heartbeatEvery: row.heartbeatEvery,
          heartbeatMd: row.heartbeatMd,
        })),
      ),
    };
  }

  async updateProjectHeartbeat(projectId: string, dto: UpdateProjectHeartbeatDto) {
    let every: string;
    try {
      every = validateHeartbeatEvery(dto.every);
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : 'Invalid heartbeat interval',
      );
    }

    if (dto.enabled && every === '0m') {
      throw new BadRequestException('Cannot enable heartbeat with interval 0m');
    }

    await this.prisma.project.update({
      where: { id: projectId },
      data: {
        heartbeatEnabled: dto.enabled,
        heartbeatEvery: every,
        heartbeatMd: dto.heartbeatMd ?? null,
      },
    });

    await this.workspace.syncProjectRuntime(projectId);
    return this.getProjectHeartbeat(projectId);
  }

  async getAgentHeartbeat(projectId: string, slug: string) {
    const project = await this.loadProjectHeartbeat(projectId);
    const agent = await this.prisma.projectAgent.findUnique({
      where: { projectId_slug: { projectId, slug } },
      select: {
        slug: true,
        name: true,
        enabled: true,
        heartbeatMode: true,
        heartbeatEvery: true,
        heartbeatMd: true,
      },
    });
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    const mode = parseHeartbeatMode(agent.heartbeatMode);
    const projectRow = {
      heartbeatEnabled: project.heartbeatEnabled,
      heartbeatEvery: project.heartbeatEvery,
      heartbeatMd: project.heartbeatMd,
    };
    const effectiveEvery = resolveAgentHeartbeatEvery(projectRow, {
      slug: agent.slug,
      enabled: agent.enabled,
      heartbeatMode: agent.heartbeatMode,
      heartbeatEvery: agent.heartbeatEvery,
      heartbeatMd: agent.heartbeatMd,
    });

    return {
      agentId: agent.slug,
      name: agent.name,
      mode,
      every: agent.heartbeatEvery,
      heartbeatMd: agent.heartbeatMd,
      enabled: effectiveEvery !== null,
      effectiveEvery,
      mainEnabled: project.heartbeatEnabled,
      mainEvery: project.heartbeatEvery,
    };
  }

  async updateAgentHeartbeat(
    projectId: string,
    slug: string,
    dto: UpdateAgentHeartbeatDto,
  ) {
    const agent = await this.prisma.projectAgent.findUnique({
      where: { projectId_slug: { projectId, slug } },
    });
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    let heartbeatEvery: string | null = null;
    if (dto.mode === 'custom') {
      if (!dto.every?.trim()) {
        throw new BadRequestException('Interval is required for custom heartbeat mode');
      }
      try {
        heartbeatEvery = validateHeartbeatEvery(dto.every);
      } catch (err) {
        throw new BadRequestException(
          err instanceof Error ? err.message : 'Invalid heartbeat interval',
        );
      }
      if (heartbeatEvery === '0m') {
        throw new BadRequestException('Custom heartbeat interval cannot be 0m');
      }
    }

    if (dto.mode === 'inherit') {
      const project = await this.loadProjectHeartbeat(projectId);
      if (!project.heartbeatEnabled) {
        throw new BadRequestException(
          'Main heartbeat is disabled — enable it on the project Heartbeat tab first',
        );
      }
    }

    await this.prisma.projectAgent.update({
      where: { id: agent.id },
      data: {
        heartbeatMode: dto.mode,
        heartbeatEvery: dto.mode === 'custom' ? heartbeatEvery : null,
        heartbeatMd: dto.heartbeatMd ?? null,
      },
    });

    await this.workspace.syncProjectRuntime(projectId);
    return this.getAgentHeartbeat(projectId, slug);
  }
}
