import {
  BadGatewayException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

const DEFAULT_CLAWHUB_API_BASE = 'https://clawhub.ai';
const REQUEST_TIMEOUT_MS = 30_000;

export type ClawHubCatalogEntry = {
  slug: string;
  displayName: string;
  summary: string;
  tags: string[];
};

type ClawHubSearchResponse = {
  results?: Array<{
    slug?: string;
    displayName?: string;
    summary?: string | null;
  }>;
};

type ClawHubSkillsListResponse = {
  items?: Array<{
    slug?: string;
    displayName?: string;
    summary?: string | null;
    metadata?: { os?: string[]; systems?: string[] } | null;
  }>;
};

type ClawHubSkillDetailResponse = {
  skill?: {
    slug?: string;
    displayName?: string;
    summary?: string | null;
    metadata?: { os?: string[]; systems?: string[] } | null;
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

function normalizeEntry(
  slug: string,
  displayName: string | undefined,
  summary: string | null | undefined,
  metadata?: { os?: string[]; systems?: string[] } | null,
): ClawHubCatalogEntry {
  const safeSlug = slug.trim();
  const name = displayName?.trim() || safeSlug;
  return {
    slug: safeSlug,
    displayName: name,
    summary: summary?.trim() || 'No description.',
    tags: metadataToTags(metadata),
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
    throw new ServiceUnavailableException(
      `Cannot reach ClawHub (${resolveClawHubApiBase()}). Check network or CLAWHUB_API_BASE. (${message})`,
    );
  }

  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    throw new ServiceUnavailableException(
      retryAfter
        ? `ClawHub rate limit exceeded. Retry after ${retryAfter}s.`
        : 'ClawHub rate limit exceeded. Please try again shortly.',
    );
  }

  if (response.status === 404) {
    throw new NotFoundException('Skill not found on ClawHub');
  }

  if (!response.ok) {
    const body = (await response.text()).trim();
    throw new BadGatewayException(
      body || `ClawHub request failed (${response.status})`,
    );
  }

  return response;
}

export async function clawHubSearch(query: string, limit = 50): Promise<ClawHubCatalogEntry[]> {
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
      return normalizeEntry(slug, row.displayName, row.summary);
    })
    .filter((row): row is ClawHubCatalogEntry => Boolean(row));
}

export async function clawHubListSkills(limit = 50): Promise<ClawHubCatalogEntry[]> {
  const response = await clawHubRequest('/api/v1/skills', {
    limit: String(Math.min(Math.max(limit, 1), 200)),
    sort: 'recommended',
    nonSuspiciousOnly: 'true',
  });
  const data = (await response.json()) as ClawHubSkillsListResponse;
  const rows = data.items ?? [];
  return rows
    .map((row) => {
      const slug = String(row.slug ?? '').trim();
      if (!slug) return null;
      return normalizeEntry(slug, row.displayName, row.summary, row.metadata);
    })
    .filter((row): row is ClawHubCatalogEntry => Boolean(row));
}

export async function clawHubGetSkill(slug: string): Promise<ClawHubCatalogEntry> {
  const response = await clawHubRequest(`/api/v1/skills/${encodeURIComponent(slug)}`);
  const data = (await response.json()) as ClawHubSkillDetailResponse;
  const skill = data.skill;
  if (!skill?.slug) {
    throw new NotFoundException('Skill not found on ClawHub');
  }
  return normalizeEntry(skill.slug, skill.displayName, skill.summary, skill.metadata);
}

export async function clawHubFetchSkillMarkdown(slug: string): Promise<string> {
  const response = await clawHubRequest(`/api/v1/skills/${encodeURIComponent(slug)}/file`, {
    path: 'SKILL.md',
  });
  return response.text();
}
