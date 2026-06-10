import type { ChatModelProviderGroup } from '../chat/project-model-catalog';

export function modelIdSuffix(id: string): string {
  const trimmed = id.trim().toLowerCase();
  const slash = trimmed.lastIndexOf('/');
  return slash >= 0 ? trimmed.slice(slash + 1) : trimmed;
}

export function modelIdsEquivalent(a: string, b: string): boolean {
  const left = a.trim().toLowerCase();
  const right = b.trim().toLowerCase();
  if (!left || !right) return false;
  if (left === right) return true;
  return modelIdSuffix(left) === modelIdSuffix(right);
}

export function findCatalogModel(
  providers: ChatModelProviderGroup[],
  openclawId: string,
): { providerId: string; openclawId: string; name: string } | null {
  const trimmed = openclawId.trim();
  if (!trimmed) return null;

  for (const provider of providers) {
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

export function isModelInProviderCatalog(
  providers: ChatModelProviderGroup[],
  openclawId: string,
): boolean {
  return findCatalogModel(providers, openclawId) !== null;
}

/** Shown on agent cards when no AI Model provider is connected for the project. */
export const NO_MODEL_LABEL = 'No Model';

/** Effective runtime model when legacy form values are absent from the enabled provider catalog. */
export function resolveEffectiveAgentModel(params: {
  formModel: string;
  projectPrimary: string | null;
  providers: ChatModelProviderGroup[];
}): string {
  if (params.providers.length === 0) {
    return '';
  }

  const match = findCatalogModel(params.providers, params.formModel);
  if (match) {
    return match.openclawId;
  }

  const primary = params.projectPrimary?.trim();
  if (primary) {
    const primaryMatch = findCatalogModel(params.providers, primary);
    return primaryMatch?.openclawId ?? primary;
  }

  for (const provider of params.providers) {
    const fallback =
      provider.defaultModel?.trim() || provider.models[0]?.openclawId?.trim() || '';
    if (fallback) {
      return fallback;
    }
  }

  return params.formModel.trim();
}
