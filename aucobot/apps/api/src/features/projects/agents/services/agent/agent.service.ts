import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PrismaService } from '../../../../../core/database/prisma.service';
import { WorkspaceService } from '../../../workspace/services/workspace/workspace.service';
import {
  compileAgentBootstrap,
  parseAgentFormData,
  parseCollaborationMemberSlugs,
  toStoredAgentFormData,
  type AgentBootstrapFilename,
  type AgentFormInput,
} from '@aucobot/workspace-sync';
import { slugifyAgentName, validateAgentSlug } from '../../lib/agent-slug';
import { CollaborationService } from '../collaboration/collaboration.service';
import {
  isModelInProviderCatalog,
  modelIdsEquivalent,
  resolveEffectiveAgentModel,
} from '@aucobot/shared';
import { loadProjectModelCatalog } from '../../../chat/lib/project-model-catalog';

export type ProjectAgentListRow = {
  slug: string;
  name: string;
  description: string;
  avatar: string;
  model: string;
  skillsCount: number;
  enabled: boolean;
  isDefault: boolean;
  inCollaboration: boolean;
  lastSyncedAt: string | null;
  lastSyncError: string | null;
  updatedAt: string;
};

export type ProjectAgentDetail = ProjectAgentListRow & {
  formData: AgentFormInput;
  createdAt: string;
};

export type AgentTemplateRow = {
  slug: string;
  name: string;
  description: string;
  avatar: string;
  vibe: string;
  defaultModel: string;
  toolsProfile: string;
  sandboxEnabled: boolean;
  bootstrapFiles: {
    identity: string;
    soul: string;
    agents: string;
  };
};

@Injectable()
export class AgentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspace: WorkspaceService,
    private readonly collaboration: CollaborationService,
  ) {}

  private hostAgentDir(dataDir: string, slug: string): string {
    return path.join(dataDir, `workspace-${slug}`);
  }

  private assertFormValid(form: AgentFormInput): void {
    if (!form.name.trim()) {
      throw new BadRequestException('Agent name is required');
    }
    if (form.instructionsMode === 'simple' && !form.instructionsRole.trim()) {
      throw new BadRequestException('instructionsRole is required in simple mode');
    }
    if (form.instructionsMode === 'advanced' && !form.instructionsAdvanced.trim()) {
      throw new BadRequestException('instructionsAdvanced is required in advanced mode');
    }
  }

  private prepareFormData(form: AgentFormInput): AgentFormInput {
    this.assertFormValid(form);
    return form;
  }

  private async assertSkillNamesAllowed(
    projectId: string,
    skillNames: string[],
  ): Promise<void> {
    if (skillNames.length === 0) return;

    const enabledSkills = await this.prisma.projectSkill.findMany({
      where: { projectId, enabled: true },
      select: { name: true },
    });
    const allowed = new Set(enabledSkills.map((row) => row.name));
    const invalid = skillNames
      .map((name) => name.trim())
      .filter(Boolean)
      .filter((name) => !allowed.has(name));

    if (invalid.length > 0) {
      throw new BadRequestException(
        `Unknown or disabled skills: ${invalid.join(', ')}`,
      );
    }
  }

  private toListRow(
    row: {
      slug: string;
      name: string;
      description: string;
      avatar: string;
      formData: unknown;
      enabled: boolean;
      isDefault: boolean;
      lastSyncedAt: Date | null;
      lastSyncError: string | null;
      updatedAt: Date;
    },
    extras?: { inCollaboration?: boolean; model?: string },
  ): ProjectAgentListRow {
    const form = parseAgentFormData(row.formData);
    return {
      slug: row.slug,
      name: row.name,
      description: row.description,
      avatar: row.avatar,
      model: extras?.model ?? form.model,
      skillsCount: form.skillNames.length,
      enabled: row.enabled,
      isDefault: row.isDefault,
      inCollaboration: extras?.inCollaboration ?? false,
      lastSyncedAt: row.lastSyncedAt?.toISOString() ?? null,
      lastSyncError: row.lastSyncError,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private async resolveRowModel(
    projectId: string,
    formModel: string,
  ): Promise<string> {
    const catalog = await loadProjectModelCatalog({
      prisma: this.prisma,
      workspace: this.workspace,
      projectId,
    });
    return resolveEffectiveAgentModel({
      formModel,
      projectPrimary: catalog.primaryModel,
      providers: catalog.providers,
    });
  }

  private async maybeMigrateStaleAgentModel(
    projectId: string,
    slug: string,
    form: AgentFormInput,
  ): Promise<AgentFormInput> {
    const catalog = await loadProjectModelCatalog({
      prisma: this.prisma,
      workspace: this.workspace,
      projectId,
    });
    const effective = resolveEffectiveAgentModel({
      formModel: form.model,
      projectPrimary: catalog.primaryModel,
      providers: catalog.providers,
    });

    if (
      !effective ||
      catalog.providers.length === 0 ||
      modelIdsEquivalent(form.model, effective) ||
      isModelInProviderCatalog(catalog.providers, form.model)
    ) {
      return form;
    }

    const next = { ...form, model: effective };
    await this.prisma.projectAgent.update({
      where: { projectId_slug: { projectId, slug } },
      data: { formData: toStoredAgentFormData(next) as object },
    });
    await this.workspace.syncProjectRuntime(projectId);
    return next;
  }

  async listTemplates(): Promise<AgentTemplateRow[]> {
    const rows = await this.prisma.agentTemplate.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map((t) => ({
      slug: t.slug,
      name: t.name,
      description: t.description,
      avatar: t.avatar,
      vibe: t.vibe,
      defaultModel: t.defaultModel,
      toolsProfile: t.toolsProfile,
      sandboxEnabled: t.sandboxEnabled,
      bootstrapFiles: {
        identity: t.bootstrapIdentity,
        soul: t.bootstrapSoul,
        agents: t.bootstrapAgents,
      },
    }));
  }

  async getTemplate(slug: string): Promise<AgentTemplateRow> {
    const row = await this.prisma.agentTemplate.findFirst({
      where: { slug, isActive: true },
    });
    if (!row) {
      throw new NotFoundException('Agent template not found');
    }
    return {
      slug: row.slug,
      name: row.name,
      description: row.description,
      avatar: row.avatar,
      vibe: row.vibe,
      defaultModel: row.defaultModel,
      toolsProfile: row.toolsProfile,
      sandboxEnabled: row.sandboxEnabled,
      bootstrapFiles: {
        identity: row.bootstrapIdentity,
        soul: row.bootstrapSoul,
        agents: row.bootstrapAgents,
      },
    };
  }

  async list(projectId: string): Promise<ProjectAgentListRow[]> {
    const [rows, project, catalog] = await Promise.all([
      this.prisma.projectAgent.findMany({
        where: { projectId },
        orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
      }),
      this.prisma.project.findUnique({
        where: { id: projectId },
        select: {
          collaborationEnabled: true,
          collaborationMemberSlugs: true,
        },
      }),
      loadProjectModelCatalog({
        prisma: this.prisma,
        workspace: this.workspace,
        projectId,
      }),
    ]);

    const collaborationEnabled = project?.collaborationEnabled ?? false;
    const memberSlugs = new Set(
      parseCollaborationMemberSlugs(project?.collaborationMemberSlugs),
    );

    return rows.map((r) => {
      const form = parseAgentFormData(r.formData);
      const model = resolveEffectiveAgentModel({
        formModel: form.model,
        projectPrimary: catalog.primaryModel,
        providers: catalog.providers,
      });
      return this.toListRow(r, {
        inCollaboration: collaborationEnabled && memberSlugs.has(r.slug),
        model,
      });
    });
  }

  async get(projectId: string, slug: string): Promise<ProjectAgentDetail> {
    const row = await this.findRow(projectId, slug);
    let form = parseAgentFormData(row.formData);
    form = await this.maybeMigrateStaleAgentModel(projectId, slug, form);
    const model = await this.resolveRowModel(projectId, form.model);
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        collaborationEnabled: true,
        collaborationMemberSlugs: true,
      },
    });
    const collaborationEnabled = project?.collaborationEnabled ?? false;
    const memberSlugs = parseCollaborationMemberSlugs(
      project?.collaborationMemberSlugs,
    );
    return {
      ...this.toListRow(row, {
        inCollaboration: collaborationEnabled && memberSlugs.includes(row.slug),
        model,
      }),
      formData: form,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private async findRow(projectId: string, slug: string) {
    const safeSlug = validateAgentSlug(slug);
    const row = await this.prisma.projectAgent.findUnique({
      where: { projectId_slug: { projectId, slug: safeSlug } },
    });
    if (!row) {
      throw new NotFoundException('Agent not found');
    }
    return row;
  }

  async create(params: {
    projectId: string;
    slug?: string;
    formData: Record<string, unknown>;
    enabled?: boolean;
    isDefault?: boolean;
  }): Promise<ProjectAgentDetail> {
    const parsed = parseAgentFormData(params.formData);
    const slug = params.slug ? validateAgentSlug(params.slug) : slugifyAgentName(parsed.name);
    const form = this.prepareFormData(parsed);
    await this.assertSkillNamesAllowed(params.projectId, form.skillNames);

    const existing = await this.prisma.projectAgent.findUnique({
      where: { projectId_slug: { projectId: params.projectId, slug } },
    });
    if (existing) {
      throw new ConflictException('Agent slug already exists');
    }

    const enabled = params.enabled ?? true;
    const existingCount = await this.prisma.projectAgent.count({
      where: { projectId: params.projectId },
    });
    const isDefault = params.isDefault ?? existingCount === 0;
    if (isDefault) {
      await this.clearDefault(params.projectId);
    }

    await this.prisma.projectAgent.create({
      data: {
        projectId: params.projectId,
        slug,
        name: form.name.trim(),
        description: form.description.trim(),
        avatar: form.avatar.trim() || '🤖',
        formData: toStoredAgentFormData(form) as object,
        enabled,
        isDefault,
      },
    });

    const fresh = await this.findRow(params.projectId, slug);
    if (fresh.enabled) {
      await this.syncAgentToDisk(fresh);
      await this.workspace.syncProjectRuntime(params.projectId);
    }
    return this.get(params.projectId, slug);
  }

  async update(
    projectId: string,
    slug: string,
    params: {
      formData?: Record<string, unknown>;
      enabled?: boolean;
      isDefault?: boolean;
    },
  ): Promise<ProjectAgentDetail> {
    const row = await this.findRow(projectId, slug);
    const parsed = params.formData
      ? parseAgentFormData(params.formData)
      : parseAgentFormData(row.formData);
    const form = this.prepareFormData(parsed);
    await this.assertSkillNamesAllowed(projectId, form.skillNames);

    if (params.isDefault === true) {
      await this.clearDefault(projectId);
    }

    const enabled = params.enabled ?? row.enabled;
    const isDefault = params.isDefault ?? row.isDefault;

    await this.prisma.projectAgent.update({
      where: { id: row.id },
      data: {
        name: form.name.trim(),
        description: form.description.trim(),
        avatar: form.avatar.trim() || '🤖',
        formData: toStoredAgentFormData(form) as object,
        enabled,
        isDefault,
      },
    });

    const fresh = await this.findRow(projectId, slug);
    if (fresh.enabled) {
      await this.syncAgentToDisk(fresh);
    }
    await this.workspace.syncProjectRuntime(projectId);
    return this.get(projectId, slug);
  }

  async setEnabled(projectId: string, slug: string, enabled: boolean): Promise<ProjectAgentDetail> {
    const row = await this.findRow(projectId, slug);
    await this.prisma.projectAgent.update({
      where: { id: row.id },
      data: { enabled },
    });
    const fresh = await this.findRow(projectId, slug);
    if (enabled) {
      await this.syncAgentToDisk(fresh);
    } else {
      await this.collaboration.removeMember(projectId, slug);
    }
    await this.workspace.syncProjectRuntime(projectId);
    return this.get(projectId, slug);
  }

  async setDefault(projectId: string, slug: string): Promise<ProjectAgentDetail> {
    const row = await this.findRow(projectId, slug);
    await this.clearDefault(projectId);
    await this.prisma.projectAgent.update({
      where: { id: row.id },
      data: { isDefault: true, enabled: true },
    });
    const fresh = await this.findRow(projectId, slug);
    await this.syncAgentToDisk(fresh);
    await this.workspace.syncProjectRuntime(projectId);
    return this.get(projectId, slug);
  }

  async duplicate(
    projectId: string,
    slug: string,
    params?: { slug?: string; name?: string },
  ): Promise<ProjectAgentDetail> {
    const sourceDetail = await this.get(projectId, slug);
    const source = await this.findRow(projectId, slug);
    const form = parseAgentFormData(source.formData);
    if (params?.name) {
      form.name = params.name;
    } else {
      form.name = `${form.name} (Copy)`;
    }
    const newSlug = params?.slug ? validateAgentSlug(params.slug) : slugifyAgentName(form.name);
    const created = await this.create({
      projectId,
      slug: newSlug,
      formData: form as unknown as Record<string, unknown>,
      enabled: false,
      isDefault: false,
    });
    if (sourceDetail.inCollaboration) {
      await this.collaboration.addMember(projectId, created.slug);
    }
    return this.get(projectId, created.slug);
  }

  async remove(projectId: string, slug: string): Promise<void> {
    const row = await this.findRow(projectId, slug);
    await this.collaboration.removeMember(projectId, row.slug);
    await this.prisma.projectAgent.delete({ where: { id: row.id } });
    const dataDir = this.workspace.resolveProjectDataDir(projectId);
    try {
      await rm(this.hostAgentDir(dataDir, row.slug), { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    if (row.isDefault) {
      const next = await this.prisma.projectAgent.findFirst({
        where: { projectId, enabled: true },
        orderBy: { updatedAt: 'desc' },
      });
      if (next) {
        await this.prisma.projectAgent.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }
    await this.workspace.syncProjectRuntime(projectId);
  }

  async syncAllEnabled(projectId: string): Promise<{ synced: number; failed: number }> {
    const rows = await this.prisma.projectAgent.findMany({
      where: { projectId, enabled: true },
    });
    let synced = 0;
    let failed = 0;
    for (const row of rows) {
      try {
        await this.syncAgentToDisk(row);
        synced += 1;
      } catch {
        failed += 1;
      }
    }
    await this.workspace.syncProjectRuntime(projectId);
    return { synced, failed };
  }

  private async clearDefault(projectId: string): Promise<void> {
    await this.prisma.projectAgent.updateMany({
      where: { projectId, isDefault: true },
      data: { isDefault: false },
    });
  }

  private async syncAgentToDisk(row: {
    id: string;
    projectId: string;
    slug: string;
    formData: unknown;
    enabled: boolean;
  }) {
    try {
      const form = parseAgentFormData(row.formData);
      const bundle = compileAgentBootstrap(form);
      const dataDir = await this.workspace.ensureProjectLayout(row.projectId);
      const dir = this.hostAgentDir(dataDir, row.slug);
      await mkdir(dir, { recursive: true });
      for (const name of Object.keys(bundle.files) as AgentBootstrapFilename[]) {
        await writeFile(path.join(dir, name), bundle.files[name], 'utf8');
      }
      await this.prisma.projectAgent.update({
        where: { id: row.id },
        data: {
          lastSyncedAt: new Date(),
          lastSyncError: null,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      await this.prisma.projectAgent.update({
        where: { id: row.id },
        data: { lastSyncError: message },
      });
      throw err;
    }
  }
}
