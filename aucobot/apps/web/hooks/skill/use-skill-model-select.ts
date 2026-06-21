'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { projectApi } from '@/lib/api/project';
import { translate } from '@/lib/i18n/translate';

import type { SkillAiEditorOptionsResponse } from '@/schemas/project.schema';

const STORAGE_PREFIX = 'skill-panel-model:';

function loadStoredSelection(projectId: string): {
  providerId?: string;
  modelId?: string;
} {
  if (typeof window === 'undefined' || !projectId) return {};
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${projectId}`);
    if (!raw) return {};
    return JSON.parse(raw) as { providerId?: string; modelId?: string };
  } catch {
    return {};
  }
}

function saveStoredSelection(
  projectId: string,
  providerId: string,
  modelId: string,
) {
  if (typeof window === 'undefined' || !projectId) return;
  sessionStorage.setItem(
    `${STORAGE_PREFIX}${projectId}`,
    JSON.stringify({ providerId, modelId }),
  );
}

export function useSkillModelSelect(projectId: string) {
  const fetchKey = projectId || null;
  const [trackedFetchKey, setTrackedFetchKey] = useState<string | null>(null);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [providerId, setProviderId] = useState<string | undefined>();
  const [modelId, setModelId] = useState<string | undefined>();
  const [modelOptions, setModelOptions] =
    useState<SkillAiEditorOptionsResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  if (fetchKey !== trackedFetchKey) {
    setTrackedFetchKey(fetchKey);
    if (fetchKey) {
      setModelsLoading(true);
      setLoadError(null);
    } else {
      setModelsLoading(false);
      setModelOptions(null);
      setProviderId(undefined);
      setModelId(undefined);
      setLoadError(null);
    }
  }

  useEffect(() => {
    if (!projectId) return;

    void projectApi
      .skillAiEditorOptions(projectId)
      .then((res) => {
        setModelOptions(res);
        setLoadError(null);
        const stored = loadStoredSelection(projectId);
        const storedProvider = stored.providerId
          ? res.providers.find((p) => p.providerId === stored.providerId)
          : undefined;
        const provider = storedProvider ?? res.providers[0];

        if (provider) {
          setProviderId(provider.providerId);
          const storedModel =
            stored.modelId &&
            provider.models.some((m) => m.openclawId === stored.modelId)
              ? stored.modelId
              : undefined;
          const model =
            storedModel ??
            provider.defaultModel ??
            provider.models[0]?.openclawId ??
            '';
          setModelId(model || undefined);
        } else {
          setProviderId(undefined);
          setModelId(undefined);
        }
      })
      .catch((err) => {
        setModelOptions({ providers: [] });
        setLoadError(
          err instanceof Error ? err.message : translate('aiModel.errors.loadModels'),
        );
      })
      .finally(() => setModelsLoading(false));
  }, [projectId]);

  const activeProvider = useMemo(
    () => modelOptions?.providers.find((p) => p.providerId === providerId),
    [modelOptions, providerId],
  );

  const providerSelectOptions = useMemo(
    () =>
      (modelOptions?.providers ?? []).map((p) => ({
        value: p.providerId,
        label: p.displayName,
      })),
    [modelOptions],
  );

  const modelSelectOptions = useMemo(
    () =>
      (activeProvider?.models ?? []).map((m) => ({
        value: m.openclawId,
        label: m.name,
      })),
    [activeProvider],
  );

  const hasProviders = (modelOptions?.providers.length ?? 0) > 0;

  const handleProviderChange = useCallback(
    (nextProviderId: string) => {
      setProviderId(nextProviderId);
      const p = modelOptions?.providers.find(
        (x) => x.providerId === nextProviderId,
      );
      if (p) {
        const nextModel =
          p.defaultModel ?? p.models[0]?.openclawId ?? '';
        setModelId(nextModel || undefined);
        if (projectId && nextModel) {
          saveStoredSelection(projectId, nextProviderId, nextModel);
        }
      }
    },
    [modelOptions, projectId],
  );

  const handleModelChange = useCallback(
    (nextModelId: string) => {
      setModelId(nextModelId);
      if (projectId && providerId) {
        saveStoredSelection(projectId, providerId, nextModelId);
      }
    },
    [projectId, providerId],
  );

  return {
    modelsLoading,
    loadError,
    providerId,
    modelId,
    providerSelectOptions,
    modelSelectOptions,
    hasProviders,
    handleProviderChange,
    handleModelChange,
    activeProvider,
  };
}
