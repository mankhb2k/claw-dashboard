'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { chatApi } from '@/lib/api/chat';
import { translate } from '@/lib/i18n/translate';
import {
  resolveAgentPrimaryOpenClawId,
  resolveModelSelection,
} from '@/utils/chat/model-catalog';

export function useModelCatalog(
  projectId: string,
  selectedOpenClawId?: string,
) {
  const fetchKey = projectId || null;
  const [trackedFetchKey, setTrackedFetchKey] = useState<string | null>(null);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelOptions, setModelOptions] = useState<
    Awaited<ReturnType<typeof chatApi.listModels>> | null
  >(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [userSelection, setUserSelection] = useState<{
    providerId?: string;
    modelId?: string;
  }>({});

  if (fetchKey !== trackedFetchKey) {
    setTrackedFetchKey(fetchKey);
    if (fetchKey) {
      setModelsLoading(true);
      setLoadError(null);
    } else {
      setModelsLoading(false);
      setModelOptions(null);
      setLoadError(null);
      setUserSelection({});
    }
  }

  useEffect(() => {
    if (!projectId) return;

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
          err instanceof Error ? err.message : translate('chat.errors.loadModelCatalog'),
        );
      })
      .finally(() => setModelsLoading(false));
  }, [projectId]);

  const defaultSelection = useMemo(() => {
    if (!modelOptions || modelsLoading) return {};
    return resolveModelSelection(
      modelOptions,
      selectedOpenClawId?.trim() ||
        resolveAgentPrimaryOpenClawId(modelOptions) ||
        undefined,
    );
  }, [modelOptions, modelsLoading, selectedOpenClawId]);

  const selectionKey = `${projectId}|${modelsLoading}|${selectedOpenClawId}|${defaultSelection.providerId}|${defaultSelection.modelId}`;
  const [trackedSelectionKey, setTrackedSelectionKey] = useState(selectionKey);

  if (selectionKey !== trackedSelectionKey) {
    setTrackedSelectionKey(selectionKey);
    setUserSelection({});
  }

  const providerId = userSelection.providerId ?? defaultSelection.providerId;
  const modelId = userSelection.modelId ?? defaultSelection.modelId;

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
      const provider = modelOptions?.providers.find(
        (row) => row.providerId === nextProviderId,
      );
      const nextModel = provider
        ? (provider.defaultModel ?? provider.models[0]?.openclawId ?? '')
        : undefined;
      setUserSelection({
        providerId: nextProviderId,
        modelId: nextModel || undefined,
      });
    },
    [modelOptions],
  );

  const handleModelChange = useCallback((nextModelId: string) => {
    setUserSelection((prev) => ({
      ...prev,
      modelId: nextModelId,
    }));
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
