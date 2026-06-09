import type { ChatModelsResponse } from '@/lib/api/chat';

export type ModelSelection = {
  providerId?: string;
  modelId?: string;
};

export function isOpenClawIdInCatalog(
  catalog: ChatModelsResponse | null | undefined,
  openclawId: string,
): boolean {
  const trimmed = openclawId.trim();
  if (!trimmed || !catalog) return false;
  return catalog.providers.some((provider) =>
    provider.models.some((model) => model.openclawId === trimmed),
  );
}

export function resolveModelSelection(
  catalog: ChatModelsResponse | null | undefined,
  openclawId: string | null | undefined,
): ModelSelection {
  const primary = openclawId?.trim();
  if (!catalog?.providers.length) {
    return {};
  }

  const provider =
    (primary
      ? catalog.providers.find((row) =>
          row.models.some((model) => model.openclawId === primary),
        )
      : undefined) ?? catalog.providers[0];

  if (!provider) {
    return {};
  }

  const model =
    primary && provider.models.some((row) => row.openclawId === primary)
      ? primary
      : (provider.defaultModel ?? provider.models[0]?.openclawId ?? '');

  return {
    providerId: provider.providerId,
    modelId: model || undefined,
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
    return candidate;
  }
  return catalog.primaryModel?.trim() || null;
}
