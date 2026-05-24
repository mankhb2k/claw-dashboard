import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PrismaService } from '../../../core/database/prisma.service';
import { ProjectWorkspaceService } from '../workspace/project-workspace.service';
import {
  compileAgentBootstrap,
  parseAgentFormData,
  type AgentBootstrapFilename,
  type AgentFormInput,
} from '@aucobot/workspace-sync';
import { slugifyAgentName, validateAgentSlug } from './agent-slug';

export type ProjectAgentListRow = {
  slug: string;
  name: string;
  description: string;
  avatar: string;
  model: string;
  enabled: boolean;
  isDefault: boolean;
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
export class ProjectAgentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspace: ProjectWorkspaceService,
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

  private toListRow(row: {
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
  }): ProjectAgentListRow {
    const form = parseAgentFormData(row.formData);
    return {
      slug: row.slug,
      name: row.name,
      description: row.description,
      avatar: row.avatar,
      model: form.model,
      enabled: row.enabled,
      isDefault: row.isDefault,
      lastSyncedAt: row.lastSyncedAt?.toISOString() ?? null,
      lastSyncError: row.lastSyncError,
      updatedAt: row.updatedAt.toISOString(),
    };
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
    const rows = await this.prisma.projectAgent.findMany({
      where: { projectId },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });
    return rows.map((r) => this.toListRow(r));
  }

  async get(projectId: string, slug: string): Promise<ProjectAgentDetail> {
    const row = await this.findRow(projectId, slug);
    const form = parseAgentFormData(row.formData);
    return {
      ...this.toListRow(row),
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
    const form = parseAgentFormData(params.formData);
    this.assertFormValid(form);
    const slug = params.slug ? validateAgentSlug(params.slug) : slugifyAgentName(form.name);

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
        formData: form as object,
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
    const form = params.formData ? parseAgentFormData(params.formData) : parseAgentFormData(row.formData);
    this.assertFormValid(form);

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
        formData: form as object,
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
    const source = await this.findRow(projectId, slug);
    const form = parseAgentFormData(source.formData);
    if (params?.name) {
      form.name = params.name;
    } else {
      form.name = `${form.name} (Copy)`;
    }
    const newSlug = params?.slug ? validateAgentSlug(params.slug) : slugifyAgentName(form.name);
    return this.create({
      projectId,
      slug: newSlug,
      formData: form as unknown as Record<string, unknown>,
      enabled: false,
      isDefault: false,
    });
  }

  async remove(projectId: string, slug: string): Promise<void> {
    const row = await this.findRow(projectId, slug);
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
