import {
  ClawHubBadGatewayError,
  ClawHubNotFoundError,
  ClawHubUnavailableError,
} from './errors.js';

const DEFAULT_CLAWHUB_API_BASE = 'https://clawhub.ai';
const REQUEST_TIMEOUT_MS = 30_000;

export type ClawHubCatalogSort = 'recommended' | 'downloads' | 'stars' | 'newest' | 'updated';

export type ClawHubCatalogEntry = {
  slug: string;
  displayName: string;
  summary: string;
  tags: string[];
  downloads: number | null;
  stars: number | null;
};

type ClawHubSkillStats = {
  downloads?: number;
  stars?: number;
  installsCurrent?: number;
};

type ClawHubSearchResponse = {
  results?: Array<{
    slug?: string;
    displayName?: string;
    summary?: string | null;
    stats?: ClawHubSkillStats;
  }>;
};

type ClawHubSkillsListResponse = {
  items?: Array<{
    slug?: string;
    displayName?: string;
    summary?: string | null;
    metadata?: { os?: string[]; systems?: string[] } | null;
    stats?: ClawHubSkillStats;
  }>;
  nextCursor?: string | null;
};

export type ClawHubSkillsPage = {
  items: ClawHubCatalogEntry[];
  nextCursor: string | null;
};

const DEFAULT_LIST_PAGE_SIZE = 50;
const MAX_LIST_PAGE_SIZE = 200;

const CLAWHUB_LIST_SORTS: ClawHubCatalogSort[] = [
  'recommended',
  'downloads',
  'stars',
  'newest',
  'updated',
];

type ClawHubSkillDetailResponse = {
  skill?: {
    slug?: string;
    displayName?: string;
    summary?: string | null;
    metadata?: { os?: string[]; systems?: string[] } | null;
    stats?: ClawHubSkillStats;
  };
};

export function resolveClawHubApiBase(): string {
  return (process.env.CLAWHUB_API_BASE?.trim() || DEFAULT_CLAWHUB_API_BASE).replace(/\/$/, '');
}

function metadataToTags(metadata?: { os?: string[]; systems?: string[] } | null): string[] {
  if (!metadata) return [];
  const tags = [...(metadata.os ?? []), ...(metadata.systems ?? [])];
  return tags.map((t) => String(t).trim()).filter(Boolean);
}

function resolveStats(stats?: ClawHubSkillStats | null): {
  downloads: number | null;
  stars: number | null;
} {
  const downloads =
    typeof stats?.downloads === 'number' && Number.isFinite(stats.downloads)
      ? stats.downloads
      : null;
  const stars =
    typeof stats?.stars === 'number' && Number.isFinite(stats.stars) ? stats.stars : null;
  return { downloads, stars };
}

function normalizeEntry(input: {
  slug: string;
  displayName?: string;
  summary?: string | null;
  metadata?: { os?: string[]; systems?: string[] } | null;
  stats?: ClawHubSkillStats | null;
}): ClawHubCatalogEntry {
  const safeSlug = input.slug.trim();
  const name = input.displayName?.trim() || safeSlug;
  const stat = resolveStats(input.stats);
  return {
    slug: safeSlug,
    displayName: name,
    summary: input.summary?.trim() || 'No description.',
    tags: metadataToTags(input.metadata),
    ...stat,
  };
}

async function clawHubRequest(path: string, query?: Record<string, string>): Promise<Response> {
  const url = new URL(`${resolveClawHubApiBase()}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, value);
      }
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json, text/plain' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    throw new ClawHubUnavailableError(
      `Cannot reach ClawHub (${resolveClawHubApiBase()}). Check network or CLAWHUB_API_BASE. (${message})`,
    );
  }

  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    throw new ClawHubUnavailableError(
      retryAfter
        ? `ClawHub rate limit exceeded. Retry after ${retryAfter}s.`
        : 'ClawHub rate limit exceeded. Please try again shortly.',
    );
  }

  if (response.status === 404) {
    throw new ClawHubNotFoundError('Skill not found on ClawHub');
  }

  if (!response.ok) {
    const body = (await response.text()).trim();
    throw new ClawHubBadGatewayError(body || `ClawHub request failed (${response.status})`);
  }

  return response;
}

export function resolveClawHubListSort(sort?: string): ClawHubCatalogSort {
  const value = sort?.trim() as ClawHubCatalogSort | undefined;
  if (value && CLAWHUB_LIST_SORTS.includes(value)) {
    return value;
  }
  return 'recommended';
}

export async function clawHubSearch(query: string, limit = 100): Promise<ClawHubCatalogEntry[]> {
  const response = await clawHubRequest('/api/v1/search', {
    q: query.trim(),
    limit: String(Math.min(Math.max(limit, 1), 100)),
    nonSuspiciousOnly: 'true',
  });
  const data = (await response.json()) as ClawHubSearchResponse;
  const rows = data.results ?? [];
  return rows
    .map((row) => {
      const slug = String(row.slug ?? '').trim();
      if (!slug) return null;
      return normalizeEntry({
        slug,
        displayName: row.displayName,
        summary: row.summary,
        stats: row.stats,
      });
    })
    .filter((row): row is ClawHubCatalogEntry => Boolean(row));
}

function mapSkillsListRows(data: ClawHubSkillsListResponse): ClawHubCatalogEntry[] {
  const rows = data.items ?? [];
  return rows
    .map((row) => {
      const slug = String(row.slug ?? '').trim();
      if (!slug) return null;
      return normalizeEntry({
        slug,
        displayName: row.displayName,
        summary: row.summary,
        metadata: row.metadata,
        stats: row.stats,
      });
    })
    .filter((row): row is ClawHubCatalogEntry => Boolean(row));
}

export async function clawHubListSkillsPage(options?: {
  limit?: number;
  cursor?: string;
  sort?: ClawHubCatalogSort;
}): Promise<ClawHubSkillsPage> {
  const limit = Math.min(
    Math.max(options?.limit ?? DEFAULT_LIST_PAGE_SIZE, 1),
    MAX_LIST_PAGE_SIZE,
  );
  const query: Record<string, string> = {
    limit: String(limit),
    sort: resolveClawHubListSort(options?.sort),
    nonSuspiciousOnly: 'true',
  };
  const cursor = options?.cursor?.trim();
  if (cursor) {
    query.cursor = cursor;
  }

  const response = await clawHubRequest('/api/v1/skills', query);
  const data = (await response.json()) as ClawHubSkillsListResponse;
  const next = data.nextCursor?.trim() || null;
  return {
    items: mapSkillsListRows(data),
    nextCursor: next,
  };
}

export async function clawHubGetSkill(slug: string): Promise<ClawHubCatalogEntry> {
  const response = await clawHubRequest(`/api/v1/skills/${encodeURIComponent(slug)}`);
  const data = (await response.json()) as ClawHubSkillDetailResponse;
  const skill = data.skill;
  if (!skill?.slug) {
    throw new ClawHubNotFoundError('Skill not found on ClawHub');
  }
  return normalizeEntry({
    slug: skill.slug,
    displayName: skill.displayName,
    summary: skill.summary,
    metadata: skill.metadata,
    stats: skill.stats,
  });
}

export async function clawHubFetchSkillMarkdown(slug: string): Promise<string> {
  const response = await clawHubRequest(`/api/v1/skills/${encodeURIComponent(slug)}/file`, {
    path: 'SKILL.md',
  });
  return response.text();
}
