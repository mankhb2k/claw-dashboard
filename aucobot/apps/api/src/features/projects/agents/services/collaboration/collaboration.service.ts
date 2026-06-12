import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  AgentCollaborationValidationError,
  buildAgentToAgentAllowListFromCollaboration,
  legacyTeamFormSlice,
  normalizeCollaborationSettings,
  parseCollaborationMemberSlugs,
  removeSlugFromCollaborationMembers,
  resolveProjectCollaborationSettings,
  validateCollaborationSettings,
  type ProjectCollaborationSettings,
} from '@aucobot/workspace-sync';
import { PrismaService } from '../../../../../core/database/prisma.service';
import { WorkspaceService } from '../../../workspace/services/workspace/workspace.service';

export type ProjectCollaborationResponse = ProjectCollaborationSettings & {
  effectiveAllow: string[];
  legacyDerived: boolean;
};

@Injectable()
export class CollaborationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspace: WorkspaceService,
  ) {}

  private readStoredCollaboration(project: {
    collaborationEnabled: boolean;
    collaborationMemberSlugs: unknown;
  }): ProjectCollaborationSettings {
    return normalizeCollaborationSettings({
      enabled: project.collaborationEnabled,
      memberSlugs: parseCollaborationMemberSlugs(project.collaborationMemberSlugs),
    });
  }

  private async loadProjectAgents(projectId: string) {
    return this.prisma.projectAgent.findMany({
      where: { projectId },
      select: { slug: true, enabled: true, formData: true },
    });
  }

  private resolveCollaboration(
    stored: ProjectCollaborationSettings,
    agents: Awaited<ReturnType<CollaborationService['loadProjectAgents']>>,
  ): { settings: ProjectCollaborationSettings; legacyDerived: boolean } {
    const hasStored = stored.enabled || stored.memberSlugs.length > 0;
    const settings = resolveProjectCollaborationSettings({
      stored,
      legacyAgents: agents.map((row) => ({
        slug: row.slug,
        formData: legacyTeamFormSlice(row.formData),
      })),
    });
    if (hasStored) {
      return { settings, legacyDerived: false };
    }
    const legacyDerived =
      settings.enabled && settings.memberSlugs.length > 0;
    return { settings, legacyDerived };
  }

  private effectiveAllow(
    collaboration: ProjectCollaborationSettings,
    agents: { slug: string; enabled: boolean }[],
  ): string[] {
    const enabledSlugs = agents.filter((row) => row.enabled).map((row) => row.slug);
    return buildAgentToAgentAllowListFromCollaboration(collaboration, enabledSlugs).allow;
  }

  async get(projectId: string): Promise<ProjectCollaborationResponse> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        collaborationEnabled: true,
        collaborationMemberSlugs: true,
      },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const agents = await this.loadProjectAgents(projectId);
    const stored = this.readStoredCollaboration(project);
    const { settings, legacyDerived } = this.resolveCollaboration(stored, agents);

    if (legacyDerived) {
      await this.persistCollaboration(projectId, settings);
      return {
        ...settings,
        effectiveAllow: this.effectiveAllow(settings, agents),
        legacyDerived: false,
      };
    }

    return {
      ...settings,
      effectiveAllow: this.effectiveAllow(settings, agents),
      legacyDerived: false,
    };
  }

  private async persistCollaboration(
    projectId: string,
    settings: ProjectCollaborationSettings,
  ): Promise<void> {
    const normalized = normalizeCollaborationSettings(settings);
    await this.prisma.project.update({
      where: { id: projectId },
      data: {
        collaborationEnabled: normalized.enabled,
        collaborationMemberSlugs: normalized.memberSlugs,
      },
    });
    await this.workspace.syncProjectRuntime(projectId);
  }

  async update(
    projectId: string,
    input: ProjectCollaborationSettings,
  ): Promise<ProjectCollaborationResponse> {
    const agents = await this.loadProjectAgents(projectId);
    const normalized = normalizeCollaborationSettings(input);

    try {
      validateCollaborationSettings({
        collaboration: normalized,
        projectAgents: agents.map((row) => ({
          slug: row.slug,
          enabled: row.enabled,
        })),
      });
    } catch (err) {
      if (err instanceof AgentCollaborationValidationError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }

    await this.persistCollaboration(projectId, normalized);

    return {
      ...normalized,
      effectiveAllow: this.effectiveAllow(normalized, agents),
      legacyDerived: false,
    };
  }

  async addMember(projectId: string, slug: string): Promise<void> {
    const normalizedSlug = slug.trim().toLowerCase();
    if (!normalizedSlug) {
      return;
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        collaborationEnabled: true,
        collaborationMemberSlugs: true,
      },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const agents = await this.loadProjectAgents(projectId);
    const stored = this.readStoredCollaboration(project);
    if (stored.memberSlugs.includes(normalizedSlug)) {
      return;
    }

    const next = normalizeCollaborationSettings({
      enabled: true,
      memberSlugs: [...stored.memberSlugs, normalizedSlug],
    });

    try {
      validateCollaborationSettings({
        collaboration: next,
        projectAgents: agents.map((row) => ({
          slug: row.slug,
          enabled: row.enabled,
        })),
      });
    } catch (err) {
      if (err instanceof AgentCollaborationValidationError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }

    await this.persistCollaboration(projectId, next);
  }

  async removeMember(projectId: string, removedSlug: string): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        collaborationEnabled: true,
        collaborationMemberSlugs: true,
      },
    });
    if (!project) {
      return;
    }

    const stored = this.readStoredCollaboration(project);
    const next = removeSlugFromCollaborationMembers(stored, removedSlug);
    if (!next) {
      return;
    }

    await this.persistCollaboration(projectId, next);
  }
}
