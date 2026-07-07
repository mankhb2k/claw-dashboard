import {
  BadGatewayException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

import {
  ClawHubBadGatewayError,
  ClawHubNotFoundError,
  ClawHubUnavailableError,
  clawHubFetchSkillMarkdown as fetchSkillMarkdown,
  clawHubGetSkill as getSkill,
  clawHubListSkillsPage as listSkillsPage,
  clawHubSearch as search,
  type ClawHubCatalogEntry,
  type ClawHubCatalogSort,
  type ClawHubSkillsPage,
} from '@claw-dashboard/clawhub-client';

export type { ClawHubCatalogEntry, ClawHubCatalogSort, ClawHubSkillsPage };

export {
  resolveClawHubApiBase,
  resolveClawHubListSort,
} from '@claw-dashboard/clawhub-client';

function mapClawHubError(err: unknown): never {
  if (err instanceof ClawHubNotFoundError) {
    throw new NotFoundException(err.message);
  }
  if (err instanceof ClawHubUnavailableError) {
    throw new ServiceUnavailableException(err.message);
  }
  if (err instanceof ClawHubBadGatewayError) {
    throw new BadGatewayException(err.message);
  }
  if (err instanceof Error) {
    throw err;
  }
  throw new BadGatewayException(String(err));
}

export async function clawHubSearch(
  query: string,
  limit = 100,
): Promise<ClawHubCatalogEntry[]> {
  try {
    return await search(query, limit);
  } catch (err) {
    return mapClawHubError(err);
  }
}

export async function clawHubListSkillsPage(options?: {
  limit?: number;
  cursor?: string;
  sort?: ClawHubCatalogSort;
}): Promise<ClawHubSkillsPage> {
  try {
    return await listSkillsPage(options);
  } catch (err) {
    return mapClawHubError(err);
  }
}

export async function clawHubGetSkill(
  slug: string,
): Promise<ClawHubCatalogEntry> {
  try {
    return await getSkill(slug);
  } catch (err) {
    return mapClawHubError(err);
  }
}

export async function clawHubFetchSkillMarkdown(slug: string): Promise<string> {
  try {
    return await fetchSkillMarkdown(slug);
  } catch (err) {
    return mapClawHubError(err);
  }
}
