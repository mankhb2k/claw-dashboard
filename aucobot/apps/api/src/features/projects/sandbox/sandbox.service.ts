import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { WorkspaceService } from '../workspace/workspace.service';
import { parseCollaborationMemberSlugs } from '@aucobot/workspace-sync';
import type { UpdateProjectSandboxDto } from './dto/sandbox.dto';

function normalizeSlugList(slugs: string[]): string[] {
  return [...new Set(slugs.map((slug) => slug.trim().toLowerCase()).filter(Boolean))];
}

function normalizeSandboxMode(raw: string | null | undefined): 'all' | 'selected' {
  if (raw === 'selected' || raw === 'non-main') {
    return 'selected';
  }
  return 'all';
}

@Injectable()
export class SandboxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspace: WorkspaceService,
  ) {}

  private buildAgentRows(
    agents: Array<{
      slug: string;
      name: string;
      avatar: string;
      enabled: boolean;
    }>,
  ) {
    return [
      {
        slug: 'main',
        name: 'Main',
        avatar: '🦞',
        enabled: true,
      },
      ...agents.map((agent) => ({
        slug: agent.slug,
        name: agent.name,
        avatar: agent.avatar,
        enabled: agent.enabled,
      })),
    ];
  }

  async getProjectSandbox(projectId: string) {
    const [project, agents] = await Promise.all([
      this.prisma.project.findUnique({
        where: { id: projectId },
        select: {
          sandboxDefaultEnabled: true,
          sandboxDefaultMode: true,
          sandboxExemptAgentSlugs: true,
          sandboxAppliedAgentSlugs: true,
        },
      }),
      this.prisma.projectAgent.findMany({
        where: { projectId },
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
        select: {
          slug: true,
          name: true,
          avatar: true,
          enabled: true,
        },
      }),
    ]);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const mode = normalizeSandboxMode(project.sandboxDefaultMode);
    let appliedAgentSlugs = parseCollaborationMemberSlugs(project.sandboxAppliedAgentSlugs);

    // Legacy non-main with empty applied list → all custom agents (not main)
    if (mode === 'selected' && appliedAgentSlugs.length === 0) {
      appliedAgentSlugs = agents
        .filter((agent) => agent.enabled)
        .map((agent) => agent.slug);
    }

    return {
      enabled: project.sandboxDefaultEnabled,
      mode,
      exemptAgentSlugs: parseCollaborationMemberSlugs(project.sandboxExemptAgentSlugs),
      appliedAgentSlugs,
      agents: this.buildAgentRows(agents),
    };
  }

  async updateProjectSandbox(projectId: string, dto: UpdateProjectSandboxDto) {
    const mode = dto.mode;
    const exemptAgentSlugs = mode === 'all' ? normalizeSlugList(dto.exemptAgentSlugs) : [];
    const appliedAgentSlugs =
      mode === 'selected' ? normalizeSlugList(dto.appliedAgentSlugs) : [];

    await this.prisma.project.update({
      where: { id: projectId },
      data: {
        sandboxDefaultEnabled: dto.enabled,
        sandboxDefaultMode: mode,
        sandboxExemptAgentSlugs: exemptAgentSlugs,
        sandboxAppliedAgentSlugs: appliedAgentSlugs,
      },
    });

    await this.workspace.syncProjectRuntime(projectId);
    return this.getProjectSandbox(projectId);
  }
}
