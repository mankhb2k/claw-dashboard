import type { ChatModelsResponse } from '@/lib/api/chat';
import {
  findCatalogModelInCatalog,
  isOpenClawIdInCatalog,
  NO_MODEL_LABEL,
} from '@aucobot/shared';

export type ModelSelection = {
  providerId?: string;
  modelId?: string;
};

export { NO_MODEL_LABEL };

export function findCatalogModel(
  catalog: ChatModelsResponse | null | undefined,
  openclawId: string,
) {
  return findCatalogModelInCatalog(catalog, openclawId);
}

export function isOpenClawIdInCatalogResponse(
  catalog: ChatModelsResponse | null | undefined,
  openclawId: string,
): boolean {
  return isOpenClawIdInCatalog(catalog, openclawId);
}

export function resolveModelDisplayName(
  catalog: ChatModelsResponse | null | undefined,
  openclawId: string,
): string {
  if (!catalog?.providers?.length) {
    return NO_MODEL_LABEL;
  }
  const trimmed = openclawId.trim();
  if (!trimmed) return NO_MODEL_LABEL;
  return findCatalogModel(catalog, trimmed)?.name ?? NO_MODEL_LABEL;
}

export function resolveModelSelection(
  catalog: ChatModelsResponse | null | undefined,
  openclawId: string | null | undefined,
): ModelSelection {
  const primary = openclawId?.trim();
  if (!catalog?.providers.length) {
    return primary ? { modelId: primary } : {};
  }

  if (primary) {
    const match = findCatalogModel(catalog, primary);
    if (match) {
      return { providerId: match.providerId, modelId: match.openclawId };
    }
    return {
      providerId: catalog.providers[0]?.providerId,
      modelId: primary,
    };
  }

  const fallbackId =
    resolveAgentPrimaryOpenClawId(catalog) ||
    catalog.providers[0]?.defaultModel ||
    catalog.providers[0]?.models[0]?.openclawId ||
    '';

  if (!fallbackId) {
    return {};
  }

  const match = findCatalogModel(catalog, fallbackId);
  if (match) {
    return { providerId: match.providerId, modelId: match.openclawId };
  }

  return {
    providerId: catalog.providers[0]?.providerId,
    modelId: fallbackId,
  };
}

export function resolveAgentPrimaryOpenClawId(
  catalog: ChatModelsResponse | null | undefined,
): string | null {
  if (!catalog) return null;
  const candidate =
    catalog.agentPrimaryModel?.trim() || catalog.primaryModel?.trim() || '';
  if (!candidate) return null;
  if (isOpenClawIdInCatalogResponse(catalog, candidate)) {
    const match = findCatalogModel(catalog, candidate);
    return match?.openclawId ?? candidate;
  }
  return catalog.primaryModel?.trim() || null;
}
