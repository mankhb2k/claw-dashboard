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
  buildSkillMarkdown,
  MAX_SKILL_BODY_BYTES,
  validateSkillName,
  validateSkillSlug,
} from '@aucobot/workspace-sync';

export type ProjectSkillListRow = {
  slug: string;
  name: string;
  description: string;
  heading: string | null;
  enabled: boolean;
  lastSyncedAt: string | null;
  lastSyncError: string | null;
  updatedAt: string;
};

export type ProjectSkillDetail = ProjectSkillListRow & {
  bodyMarkdown: string;
  createdAt: string;
};

@Injectable()
export class ProjectSkillsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspace: ProjectWorkspaceService,
  ) {}

  private skillDir(dataDir: string, slug: string): string {
    return path.join(dataDir, 'workspace', 'skills', slug);
  }

  private skillFilePath(dataDir: string, slug: string): string {
    return path.join(this.skillDir(dataDir, slug), 'SKILL.md');
  }

  private assertBodySize(bodyMarkdown: string): void {
    const bytes = Buffer.byteLength(bodyMarkdown, 'utf8');
    if (bytes > MAX_SKILL_BODY_BYTES) {
      throw new BadRequestException(
        `Skill body too large (${bytes} bytes, max ${MAX_SKILL_BODY_BYTES})`,
      );
    }
  }

  private toListRow(row: {
    slug: string;
    name: string;
    description: string;
    heading: string | null;
    enabled: boolean;
    lastSyncedAt: Date | null;
    lastSyncError: string | null;
    updatedAt: Date;
  }): ProjectSkillListRow {
    return {
      slug: row.slug,
      name: row.name,
      description: row.description,
      heading: row.heading,
      enabled: row.enabled,
      lastSyncedAt: row.lastSyncedAt?.toISOString() ?? null,
      lastSyncError: row.lastSyncError,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async list(projectId: string): Promise<ProjectSkillListRow[]> {
    const rows = await this.prisma.projectSkill.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((r) => this.toListRow(r));
  }

  async get(projectId: string, slug: string): Promise<ProjectSkillDetail> {
    const row = await this.findRow(projectId, slug);
    return {
      ...this.toListRow(row),
      bodyMarkdown: row.bodyMarkdown,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private async findRow(projectId: string, slug: string) {
    const safeSlug = validateSkillSlug(slug);
    const row = await this.prisma.projectSkill.findUnique({
      where: { projectId_slug: { projectId, slug: safeSlug } },
    });
    if (!row) {
      throw new NotFoundException('Skill not found');
    }
    return row;
  }

  async create(params: {
    projectId: string;
    slug: string;
    name: string;
    description: string;
    heading?: string;
    bodyMarkdown?: string;
    enabled?: boolean;
  }): Promise<ProjectSkillDetail> {
    const slug = validateSkillSlug(params.slug);
    const name = validateSkillName(params.name);
    const description = params.description.trim();
    if (!description) {
      throw new BadRequestException('description is required');
    }
    const bodyMarkdown = params.bodyMarkdown ?? '';
    this.assertBodySize(bodyMarkdown);

    const existing = await this.prisma.projectSkill.findUnique({
      where: { projectId_slug: { projectId: params.projectId, slug } },
    });
    if (existing) {
      throw new ConflictException(`Skill already exists: ${slug}`);
    }

    const enabled = params.enabled ?? false;
    let row = await this.prisma.projectSkill.create({
      data: {
        projectId: params.projectId,
        slug,
        name,
        description,
        heading: params.heading?.trim() || null,
        bodyMarkdown,
        enabled,
      },
    });

    if (enabled) {
      row = await this.syncSkillToDisk(row);
    }

    return {
      ...this.toListRow(row),
      bodyMarkdown: row.bodyMarkdown,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async update(
    projectId: string,
    slug: string,
    params: {
      name?: string;
      description?: string;
      heading?: string | null;
      bodyMarkdown?: string;
      enabled?: boolean;
    },
  ): Promise<ProjectSkillDetail> {
    const existing = await this.findRow(projectId, slug);

    const name = params.name !== undefined ? validateSkillName(params.name) : existing.name;
    const description =
      params.description !== undefined ? params.description.trim() : existing.description;
    if (!description) {
      throw new BadRequestException('description is required');
    }
    const bodyMarkdown =
      params.bodyMarkdown !== undefined ? params.bodyMarkdown : existing.bodyMarkdown;
    this.assertBodySize(bodyMarkdown);
    const enabled = params.enabled !== undefined ? params.enabled : existing.enabled;

    let row = await this.prisma.projectSkill.update({
      where: { id: existing.id },
      data: {
        name,
        description,
        heading: params.heading !== undefined ? params.heading?.trim() || null : existing.heading,
        bodyMarkdown,
        enabled,
        lastSyncError: null,
      },
    });

    row = await this.applyDiskSync(row);
    return {
      ...this.toListRow(row),
      bodyMarkdown: row.bodyMarkdown,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async setEnabled(projectId: string, slug: string, enabled: boolean): Promise<ProjectSkillDetail> {
    return this.update(projectId, slug, { enabled });
  }

  async delete(projectId: string, slug: string): Promise<void> {
    const existing = await this.findRow(projectId, slug);
    await this.removeSkillFromDisk(projectId, existing.slug);
    await this.prisma.projectSkill.delete({ where: { id: existing.id } });
  }

  async syncAllEnabled(projectId: string): Promise<{ synced: number; failed: number }> {
    const rows = await this.prisma.projectSkill.findMany({
      where: { projectId, enabled: true },
    });
    let synced = 0;
    let failed = 0;
    for (const row of rows) {
      const updated = await this.syncSkillToDisk(row);
      if (updated.lastSyncError) {
        failed += 1;
      } else {
        synced += 1;
      }
    }
    return { synced, failed };
  }

  private async applyDiskSync(row: {
    id: string;
    projectId: string;
    slug: string;
    name: string;
    description: string;
    heading: string | null;
    bodyMarkdown: string;
    enabled: boolean;
    lastSyncedAt: Date | null;
    lastSyncError: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    if (row.enabled) {
      return this.syncSkillToDisk(row);
    }
    await this.removeSkillFromDisk(row.projectId, row.slug);
    return this.prisma.projectSkill.update({
      where: { id: row.id },
      data: {
        lastSyncedAt: new Date(),
        lastSyncError: null,
      },
    });
  }

  private async syncSkillToDisk(row: {
    id: string;
    projectId: string;
    slug: string;
    name: string;
    description: string;
    heading: string | null;
    bodyMarkdown: string;
    enabled: boolean;
    lastSyncedAt: Date | null;
    lastSyncError: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    try {
      const dataDir = await this.workspace.ensureProjectLayout(row.projectId);
      const dir = this.skillDir(dataDir, row.slug);
      const filePath = this.skillFilePath(dataDir, row.slug);
      const content = buildSkillMarkdown(
        {
          name: row.name,
          description: row.description,
          heading: row.heading,
        },
        row.bodyMarkdown,
      );
      await mkdir(dir, { recursive: true });
      await writeFile(filePath, content, 'utf8');
      return this.prisma.projectSkill.update({
        where: { id: row.id },
        data: {
          lastSyncedAt: new Date(),
          lastSyncError: null,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      return this.prisma.projectSkill.update({
        where: { id: row.id },
        data: {
          lastSyncError: message,
        },
      });
    }
  }

  private async removeSkillFromDisk(projectId: string, slug: string): Promise<void> {
    const dataDir = await this.workspace.ensureProjectLayout(projectId);
    const dir = this.skillDir(dataDir, slug);
    try {
      await rm(dir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}
