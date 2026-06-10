import type { ChatModelsResponse } from '@/lib/api/chat';

export type ModelSelection = {
  providerId?: string;
  modelId?: string;
};

function modelIdSuffix(id: string): string {
  const trimmed = id.trim().toLowerCase();
  const slash = trimmed.lastIndexOf('/');
  return slash >= 0 ? trimmed.slice(slash + 1) : trimmed;
}

function modelIdsEquivalent(a: string, b: string): boolean {
  const left = a.trim().toLowerCase();
  const right = b.trim().toLowerCase();
  if (!left || !right) return false;
  if (left === right) return true;
  return modelIdSuffix(left) === modelIdSuffix(right);
}

export function findCatalogModel(
  catalog: ChatModelsResponse | null | undefined,
  openclawId: string,
): { providerId: string; openclawId: string; name: string } | null {
  const trimmed = openclawId.trim();
  if (!trimmed || !catalog) return null;

  for (const provider of catalog.providers) {
    for (const model of provider.models) {
      if (modelIdsEquivalent(model.openclawId, trimmed)) {
        return {
          providerId: provider.providerId,
          openclawId: model.openclawId,
          name: model.name,
        };
      }
    }
  }

  return null;
}

export function isOpenClawIdInCatalog(
  catalog: ChatModelsResponse | null | undefined,
  openclawId: string,
): boolean {
  return findCatalogModel(catalog, openclawId) !== null;
}

export const NO_MODEL_LABEL = 'No Model';

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
  if (isOpenClawIdInCatalog(catalog, candidate)) {
    const match = findCatalogModel(catalog, candidate);
    return match?.openclawId ?? candidate;
  }
  return catalog.primaryModel?.trim() || null;
}
