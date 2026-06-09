'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { chatApi } from '@/lib/api/chat';
import {
  resolveAgentPrimaryOpenClawId,
  resolveModelSelection,
} from '@/lib/chat/model-catalog';

export function useModelCatalog(
  projectId: string,
  selectedOpenClawId?: string,
) {
  const [modelsLoading, setModelsLoading] = useState(true);
  const [providerId, setProviderId] = useState<string | undefined>();
  const [modelId, setModelId] = useState<string | undefined>();
  const [modelOptions, setModelOptions] = useState<
    Awaited<ReturnType<typeof chatApi.listModels>> | null
  >(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setModelsLoading(false);
      setModelOptions(null);
      return;
    }

    setModelsLoading(true);
    void chatApi
      .listModels(projectId)
      .then((res) => {
        setModelOptions(res);
        setLoadError(null);
      })
      .catch((err) => {
        setModelOptions({
          primaryModel: null,
          agentPrimaryModel: null,
          providers: [],
        });
        setLoadError(
          err instanceof Error ? err.message : 'Failed to load model catalog',
        );
      })
      .finally(() => setModelsLoading(false));
  }, [projectId]);

  useEffect(() => {
    if (!modelOptions || modelsLoading) return;
    const selection = resolveModelSelection(
      modelOptions,
      selectedOpenClawId?.trim() ||
        resolveAgentPrimaryOpenClawId(modelOptions) ||
        undefined,
    );
    setProviderId(selection.providerId);
    setModelId(selection.modelId);
  }, [modelOptions, modelsLoading, selectedOpenClawId]);

  const activeProvider = useMemo(
    () => modelOptions?.providers.find((row) => row.providerId === providerId),
    [modelOptions, providerId],
  );

  const providerSelectOptions = useMemo(
    () =>
      (modelOptions?.providers ?? []).map((row) => ({
        value: row.providerId,
        label: row.displayName,
      })),
    [modelOptions],
  );

  const modelSelectOptions = useMemo(
    () =>
      (activeProvider?.models ?? []).map((row) => ({
        value: row.openclawId,
        label: row.name,
      })),
    [activeProvider],
  );

  const hasProviders = (modelOptions?.providers.length ?? 0) > 0;

  const handleProviderChange = useCallback(
    (nextProviderId: string) => {
      setProviderId(nextProviderId);
      const provider = modelOptions?.providers.find(
        (row) => row.providerId === nextProviderId,
      );
      if (provider) {
        const nextModel =
          provider.defaultModel ?? provider.models[0]?.openclawId ?? '';
        setModelId(nextModel || undefined);
      }
    },
    [modelOptions],
  );

  const handleModelChange = useCallback((nextModelId: string) => {
    setModelId(nextModelId);
  }, []);

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
    modelOptions,
  };
}
