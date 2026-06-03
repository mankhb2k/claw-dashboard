import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  clawHubFetchSkillMarkdown,
  clawHubGetSkill,
  clawHubListSkillsPage,
  clawHubSearch,
  resolveClawHubListSort,
  type ClawHubCatalogEntry,
} from './clawhub-client';
import { ProjectSkillsService, type ProjectSkillDetail } from './project-skills.service';

type SkillStoreSearchItem = {
  slug: string;
  name: string;
  description: string;
  heading: string;
  tags: string[];
  installed: boolean;
  downloads: number | null;
  stars: number | null;
};

type SkillStoreDetailItem = SkillStoreSearchItem & {
  bodyMarkdown: string;
};

export type SkillStoreSearchResult = {
  items: SkillStoreSearchItem[];
  nextCursor: string | null;
};

@Injectable()
export class SkillStoreService {
  constructor(private readonly skills: ProjectSkillsService) {}

  private toSearchItem(entry: ClawHubCatalogEntry, installedSet: Set<string>): SkillStoreSearchItem {
    return {
      slug: entry.slug,
      name: entry.slug,
      description: entry.summary,
      heading: entry.displayName,
      tags: entry.tags,
      installed: installedSet.has(entry.slug),
      downloads: entry.downloads,
      stars: entry.stars,
    };
  }

  private extractFrontmatterValue(frontmatter: string, key: string): string | null {
    const line = frontmatter
      .split(/\r?\n/)
      .find((l) => l.trim().toLowerCase().startsWith(`${key.toLowerCase()}:`));
    if (!line) return null;
    const value = line.slice(line.indexOf(':') + 1).trim();
    return value.replace(/^["']|["']$/g, '') || null;
  }

  private parseSkillMarkdown(markdown: string, slug: string, fallback: ClawHubCatalogEntry) {
    const text = markdown.replace(/\r\n/g, '\n');
    let bodyStart = text;
    let frontmatter = '';
    if (text.startsWith('---\n')) {
      const end = text.indexOf('\n---\n', 4);
      if (end > 0) {
        frontmatter = text.slice(4, end);
        bodyStart = text.slice(end + 5);
      }
    }

    const headingMatch = bodyStart.match(/^#\s+(.+)$/m);
    const heading = headingMatch?.[1]?.trim() || fallback.displayName;
    const name = this.extractFrontmatterValue(frontmatter, 'name') ?? slug;
    const description =
      this.extractFrontmatterValue(frontmatter, 'description') ?? fallback.summary;
    const bodyMarkdown = bodyStart.replace(/^#\s+.+$/m, '').trim();

    return { name, description, heading, bodyMarkdown };
  }

  async search(
    projectId: string,
    options?: { q?: string; cursor?: string; limit?: number; sort?: string },
  ): Promise<SkillStoreSearchResult> {
    const installed = await this.skills.list(projectId);
    const installedSet = new Set(installed.map((row) => row.slug));

    const trimmed = options?.q?.trim() ?? '';
    if (trimmed) {
      const entries = await clawHubSearch(trimmed, options?.limit ?? 100);
      return {
        items: entries.map((entry) => this.toSearchItem(entry, installedSet)),
        nextCursor: null,
      };
    }

    const page = await clawHubListSkillsPage({
      cursor: options?.cursor,
      limit: options?.limit,
      sort: resolveClawHubListSort(options?.sort),
    });
    return {
      items: page.items.map((entry) => this.toSearchItem(entry, installedSet)),
      nextCursor: page.nextCursor,
    };
  }

  async getDetail(projectId: string, slug: string): Promise<SkillStoreDetailItem> {
    const entry = await clawHubGetSkill(slug);
    const markdown = await clawHubFetchSkillMarkdown(slug);
    const parsed = this.parseSkillMarkdown(markdown, entry.slug, entry);
    const installed = await this.skills.get(projectId, entry.slug).then(
      () => true,
      () => false,
    );

    return {
      slug: entry.slug,
      name: parsed.name,
      description: parsed.description,
      heading: parsed.heading,
      tags: entry.tags,
      installed,
      downloads: entry.downloads,
      stars: entry.stars,
      bodyMarkdown: parsed.bodyMarkdown,
    };
  }

  async install(projectId: string, slug: string): Promise<ProjectSkillDetail> {
    const entry = await clawHubGetSkill(slug);
    const markdown = await clawHubFetchSkillMarkdown(slug);
    const parsed = this.parseSkillMarkdown(markdown, entry.slug, entry);

    try {
      return await this.skills.create({
        projectId,
        slug: entry.slug,
        name: parsed.name,
        description: parsed.description,
        heading: parsed.heading,
        bodyMarkdown: parsed.bodyMarkdown,
        enabled: false,
      });
    } catch (err) {
      if (err instanceof ConflictException) {
        return this.skills.get(projectId, entry.slug);
      }
      throw err;
    }
  }
}
