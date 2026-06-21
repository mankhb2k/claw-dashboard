"use client";

import { useMemo } from "react";

import { type ChatModelsResponse } from "@/lib/api/chat";
import { resolveAgentPrimaryOpenClawId } from "@/utils/chat/model-catalog";
import { resolveModelContextTokens } from "@/utils/chat/model-context-limit";
import { THINKING_LEVEL_OPTIONS } from "@/utils/chat/thinking-level";

import type { GatewaySessionRow } from "@/utils/chat/session/types";

const MODEL_OVERRIDE_HINT =
  "Session only — Telegram, Discord, and other channels still use the agent default model.";

type UseChatDerivationsParams = {
  modelOptions: ChatModelsResponse | null;
  providerId?: string;
  modelId?: string;
  agents: { id: string; name: string }[];
  sessions: GatewaySessionRow[];
  sessionKey: string;
};

/**
 * Pure derived values for the chat page (select options, context usage, hints).
 * No state or refs — only memoised projections of the inputs.
 */
export function useChatDerivations({
  modelOptions,
  providerId,
  modelId,
  agents,
  sessions,
  sessionKey,
}: UseChatDerivationsParams) {
  const agentPrimaryModel = useMemo(
    () => resolveAgentPrimaryOpenClawId(modelOptions),
    [modelOptions],
  );

  const modelIsOverride = useMemo(() => {
    if (!modelId || !agentPrimaryModel) return false;
    return modelId.trim() !== agentPrimaryModel.trim();
  }, [modelId, agentPrimaryModel]);

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

  const thinkingSelectOptions = useMemo(
    () =>
      THINKING_LEVEL_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    [],
  );

  const activeContextUsage = useMemo(() => {
    const row = sessions.find((s) => s.key === sessionKey);
    if (!row) return undefined;
    return {
      totalTokens: row.totalTokens,
      contextTokens: resolveModelContextTokens(modelId),
      totalTokensFresh: row.totalTokensFresh,
      compactionCount: row.compactionCount,
    };
  }, [sessions, sessionKey, modelId]);

  const agentOptions = useMemo(
    () =>
      agents.map((a) => ({
        value: a.id,
        label: a.name?.trim() || a.id,
      })),
    [agents],
  );

  return {
    agentPrimaryModel,
    providerSelectOptions,
    modelSelectOptions,
    thinkingSelectOptions,
    activeContextUsage,
    agentOptions,
    hasProviders: (modelOptions?.providers.length ?? 0) > 0,
    modelHint: modelIsOverride ? MODEL_OVERRIDE_HINT : undefined,
  };
}
