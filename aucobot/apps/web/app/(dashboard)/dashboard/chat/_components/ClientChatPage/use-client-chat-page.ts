"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useChatDerivations } from "./use-chat-derivations";
import { useChatSessionSearch } from "./use-chat-session-search";
import { useSidebarPreference } from "./use-sidebar-preference";
import { useChatInvokableSkills } from "@/hooks/chat/use-chat-invokable-skills";
import { useChatSandboxContext } from "@/hooks/chat/use-chat-sandbox-context";
import { useChatToolStream } from "@/hooks/chat/use-chat-tool-stream";
import { chatApi, type ChatModelsResponse } from "@/lib/api/chat";
import {
  ProjectChatClient,
  type GatewayEventFrame,
} from "@/lib/chat/project-chat-client";
import { translate } from "@/lib/i18n/translate";
import { SETUP_PATH, shouldRedirectToSetup } from "@/lib/routing/entry-route";
import { isOssRuntime } from "@/lib/runtime/runtime-mode";
import { useProjectStore } from "@/stores/project.store";
import {
  resolveAgentPrimaryOpenClawId,
  resolveModelSelection,
} from "@/utils/chat/model-catalog";
import {
  isFileOverSandboxStagingLimit,
  SANDBOX_STAGING_MAX_BYTES,
} from "@/utils/chat/sandbox-staging-limit";
import {
  deriveAutoTitleFromMessage,
  isAutoTitleCandidate,
} from "@/utils/chat/session/auto-title";
import {
  allocateNewSessionLabel,
  filterSessionsForChatSidebar,
  isBrowsableChatSession,
  isMainSessionKey,
  reconcilePatchedSessionLabels,
} from "@/utils/chat/session/display";
import {
  matchesSessionKey,
  sessionKeyForAgent,
} from "@/utils/chat/session/key";
import {
  loadLastAgentId,
  loadLastSessionKey,
  saveLastAgentId,
  saveLastSessionKey,
} from "@/utils/chat/session/last-key";
import { patchSessionModel } from "@/utils/chat/session/model-patch";
import {
  clearSessionModelSelection,
  loadSessionModelSelection,
  saveSessionModelSelection,
} from "@/utils/chat/session/model-storage";
import { patchSessionThinking } from "@/utils/chat/session/thinking-patch";
import {
  clearSessionThinkingSelection,
  resolveSessionThinkingLevel,
  saveSessionThinkingSelection,
} from "@/utils/chat/session/thinking-storage";
import {
  isHiddenToolPayloadText,
  shouldShowHistoryMessage,
} from "@/utils/chat/stream/history-filter";
import {
  extractText,
  roleOf,
  stableMessageId,
} from "@/utils/chat/stream/message-extract";
import { accumulateStreamDelta } from "@/utils/chat/stream/stream-delta";
import {
  DEFAULT_THINKING_LEVEL,
  normalizeThinkingLevel,
  type ThinkingLevel,
} from "@/utils/chat/thinking-level";
import { mergeLiveAssistantText } from "@/utils/chat/tool/stream";

import type {
  ChatPanelConnectionState,
  ChatPanelMessage,
} from "../ChatPanel/ChatPanel";
import type { ComposerSendPayload } from "@/components/chat/MessageBox";
import type {
  GatewaySessionRow,
  SessionsCreateResult,
  SessionsListResult,
} from "@/utils/chat/session/types";

type ConnectionState = ChatPanelConnectionState;

const SESSIONS_LIST_LIMIT = 50;

function rowFromMessage(
  message: unknown,
  index: number,
): ChatPanelMessage | null {
  const text = extractText(message);
  if (!text?.trim()) return null;
  const role = roleOf(message);
  if (!shouldShowHistoryMessage(role, text.trim())) return null;
  return { id: stableMessageId(message, index), role, text: text.trim() };
}

function resolveInitialSessionKey(projectId: string, agentId: string): string {
  const mainKey = sessionKeyForAgent(agentId);
  const saved = loadLastSessionKey(projectId, agentId);
  if (saved && isBrowsableChatSession(saved, agentId)) return saved;
  return mainKey;
}

export function useClientChatPage() {
  const router = useRouter();
  const projects = useProjectStore((s) => s.projects);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const project = projects[0];
  const projectId = project?.id ?? "";

  const [statusLoading, setStatusLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const [agentId, setAgentId] = useState("main");

  const { sandboxActive, stagingMaxBytes } = useChatSandboxContext(
    projectId,
    agentId,
  );
  const { invokableSkills, loading: invokableSkillsLoading } =
    useChatInvokableSkills(projectId, agentId);
  const [sessionKey, setSessionKey] = useState("agent:main:main");
  const [sessions, setSessions] = useState<GatewaySessionRow[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const {
    sessionSearch,
    setSessionSearch,
    debouncedSessionSearch,
    debouncedSessionSearchRef,
    resetSessionSearch,
  } = useChatSessionSearch();
  const [creatingSession, setCreatingSession] = useState(false);
  const { sidebarCollapsed, handleToggleSidebar } =
    useSidebarPreference(projectId);
  const [modelOptions, setModelOptions] = useState<ChatModelsResponse | null>(
    null,
  );
  const modelFetchKey = projectId ? `${projectId}:${agentId}` : null;
  const [trackedModelFetchKey, setTrackedModelFetchKey] = useState<
    string | null
  >(null);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [providerId, setProviderId] = useState<string | undefined>(undefined);
  const [modelId, setModelId] = useState<string | undefined>(undefined);

  if (modelFetchKey !== trackedModelFetchKey) {
    setTrackedModelFetchKey(modelFetchKey);
    if (modelFetchKey) {
      setModelsLoading(true);
    } else {
      setModelsLoading(false);
      setModelOptions(null);
    }
  }
  const [modelSaving, setModelSaving] = useState(false);
  const [thinkingLevel, setThinkingLevel] = useState<ThinkingLevel>(
    DEFAULT_THINKING_LEVEL,
  );
  const [thinkingSaving, setThinkingSaving] = useState(false);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("idle");
  const [messages, setMessages] = useState<ChatPanelMessage[]>([]);
  const [streamText, setStreamText] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const {
    liveItems,
    showPreparing: showToolPreparing,
    handleGatewayToolEvent,
    resetToolStream,
    registerStreamFlush,
  } = useChatToolStream(sessionKey, sending, streamText);
  const handleGatewayToolEventRef = useRef(handleGatewayToolEvent);
  const resetToolStreamRef = useRef(resetToolStream);
  const liveItemsRef = useRef(liveItems);
  const clientRef = useRef<ProjectChatClient | null>(null);
  const streamRef = useRef("");
  const sessionKeyRef = useRef(sessionKey);
  const agentIdRef = useRef(agentId);
  const historyRequestIdRef = useRef(0);
  const autoTitledSessionsRef = useRef(new Set<string>());
  const sessionsRequestIdRef = useRef(0);
  const patchedSessionLabelsRef = useRef(new Map<string, string>());
  const sessionSortPreserveRef = useRef(new Map<string, number | null>());

  useEffect(() => {
    sendingRef.current = sending;
  }, [sending]);

  useEffect(() => {
    sessionKeyRef.current = sessionKey;
  }, [sessionKey]);

  useEffect(() => {
    agentIdRef.current = agentId;
  }, [agentId]);

  useEffect(() => {
    handleGatewayToolEventRef.current = handleGatewayToolEvent;
  }, [handleGatewayToolEvent]);

  useEffect(() => {
    resetToolStreamRef.current = resetToolStream;
  }, [resetToolStream]);

  useEffect(() => {
    liveItemsRef.current = liveItems;
  }, [liveItems]);

  useEffect(() => {
    registerStreamFlush(() => {
      const text = streamRef.current;
      if (text.trim()) {
        streamRef.current = "";
        setStreamText("");
      }
      return text;
    });
  }, [registerStreamFlush]);

  const loadHistory = useCallback(
    async (client: ProjectChatClient, key: string) => {
      const requestId = ++historyRequestIdRef.current;
      const res = await client.request<{ messages?: unknown[] }>(
        "chat.history",
        {
          sessionKey: key,
          limit: 100,
        },
      );
      if (requestId !== historyRequestIdRef.current) return;
      if (sessionKeyRef.current !== key) return;
      if (sendingRef.current) return;
      const rows: ChatPanelMessage[] = [];
      const list = Array.isArray(res.messages) ? res.messages : [];
      list.forEach((msg, i) => {
        const row = rowFromMessage(msg, i);
        if (row) rows.push(row);
      });
      setMessages((prev) => {
        if (rows.length === 0 && prev.length > 0) return prev;
        if (rows.length >= prev.length) return rows;
        return [...rows, ...prev.slice(rows.length)];
      });
    },
    [],
  );

  const loadSessions = useCallback(
    async (client: ProjectChatClient, nextAgentId: string, search?: string) => {
      const requestId = ++sessionsRequestIdRef.current;
      setSessionsLoading(true);
      try {
        const params: Record<string, unknown> = {
          agentId: nextAgentId,
          limit: SESSIONS_LIST_LIMIT,
          configuredAgentsOnly: true,
          includeGlobal: false,
          includeUnknown: false,
          includeDerivedTitles: true,
        };
        const q = search?.trim();
        if (q) params.search = q;

        const res = await client.request<SessionsListResult>(
          "sessions.list",
          params,
        );
        if (requestId !== sessionsRequestIdRef.current) return;

        const rows = res.sessions ?? [];
        reconcilePatchedSessionLabels(rows, patchedSessionLabelsRef.current);
        setSessions(
          filterSessionsForChatSidebar(rows, nextAgentId, {
            labelOverrides: patchedSessionLabelsRef.current,
            updatedAtOverrides: sessionSortPreserveRef.current,
          }),
        );
      } catch (err) {
        if (requestId !== sessionsRequestIdRef.current) return;
        setError(
          err instanceof Error ? err.message : translate("chat.errors.loadSessions"),
        );
      } finally {
        if (requestId === sessionsRequestIdRef.current) {
          setSessionsLoading(false);
        }
      }
    },
    [],
  );

  const subscribeSessions = useCallback(async (client: ProjectChatClient) => {
    try {
      await client.request("sessions.subscribe", {});
    } catch {
      /* non-fatal for Phase 1 */
    }
  }, []);

  const connectChat = useCallback(() => {
    if (!projectId || !ready) return;
    clientRef.current?.disconnect();
    setConnectionState("connecting");
    setError(null);
    setStreamText("");

    const client = new ProjectChatClient({
      projectId,
      onReady: () => {
        setConnectionState("connected");
        void subscribeSessions(client);
        void loadSessions(
          client,
          agentIdRef.current,
          debouncedSessionSearchRef.current,
        );
      },
      onEvent: (evt: GatewayEventFrame) => {
        if (evt.event === "agent" || evt.event === "session.tool") {
          handleGatewayToolEventRef.current(evt);
          return;
        }

        if (evt.event === "sessions.changed") {
          const clientNow = clientRef.current;
          if (clientNow?.connected) {
            void loadSessions(
              clientNow,
              agentIdRef.current,
              debouncedSessionSearchRef.current,
            );
          }
          return;
        }

        if (evt.event !== "chat") return;
        const payload = evt.payload as {
          sessionKey?: string;
          state?: string;
          message?: unknown;
        };
        const activeKey = sessionKeyRef.current;
        if (
          payload.sessionKey &&
          !matchesSessionKey(payload.sessionKey, activeKey)
        )
          return;
        if (payload.state === "delta") {
          const deltaPayload = payload as {
            message?: unknown;
            deltaText?: string;
          };
          const t =
            (typeof deltaPayload.deltaText === "string" &&
              deltaPayload.deltaText) ||
            extractText(deltaPayload.message);
          if (t) {
            if (isHiddenToolPayloadText(t)) {
              streamRef.current = "";
              setStreamText("");
            } else {
              const merged = accumulateStreamDelta(streamRef.current, t);
              streamRef.current = merged;
              setStreamText(merged);
            }
          }
        } else if (payload.state === "final") {
          const t = extractText(payload.message);
          const merged = mergeLiveAssistantText(
            liveItemsRef.current,
            t?.trim() || streamRef.current,
          );
          if (merged.trim() && !isHiddenToolPayloadText(merged.trim())) {
            setMessages((prev) => [
              ...prev,
              { id: `a-${Date.now()}`, role: "assistant", text: merged.trim() },
            ]);
          }
          streamRef.current = "";
          setStreamText("");
          sendingRef.current = false;
          setSending(false);
          resetToolStreamRef.current();
          const clientNow = clientRef.current;
          const activeKeyNow = sessionKeyRef.current;
          if (clientNow?.connected) {
            window.setTimeout(() => {
              if (sessionKeyRef.current !== activeKeyNow || sendingRef.current)
                return;
              void loadHistory(clientNow, activeKeyNow).catch(() => undefined);
            }, 600);
            void loadSessions(
              clientNow,
              agentIdRef.current,
              debouncedSessionSearchRef.current,
            );
          }
        } else if (payload.state === "error") {
          sendingRef.current = false;
          setSending(false);
          setStreamText("");
          resetToolStreamRef.current();
          setError(translate("chat.errors.agentError"));
        } else if (payload.state === "aborted") {
          sendingRef.current = false;
          setSending(false);
          setStreamText("");
          resetToolStreamRef.current();
        }
      },
      onClose: ({ code, reason }) => {
        if (code === 1008) {
          setConnectionState("error");
          setError(
            translate("chat.errors.wsSessionExpired"),
          );
          return;
        }
        if (code === 1013 || reason.includes("not running")) {
          setConnectionState("error");
          setError(
            translate("chat.errors.gatewayNotReady"),
          );
          return;
        }
        setConnectionState("idle");
      },
      onError: (msg) => {
        setConnectionState("error");
        setError(
          msg === "WebSocket error"
            ? isOssRuntime()
              ? translate("chat.errors.gatewayUnreachableOss")
              : translate("chat.errors.gatewayUnreachable")
            : msg,
        );
      },
    });
    clientRef.current = client;
    client.connect();
  }, [
    projectId,
    ready,
    loadHistory,
    loadSessions,
    subscribeSessions,
    debouncedSessionSearchRef,
  ]);

  const {
    agentPrimaryModel,
    providerSelectOptions,
    modelSelectOptions,
    thinkingSelectOptions,
    activeContextUsage,
    agentOptions,
    hasProviders,
    modelHint,
  } = useChatDerivations({
    modelOptions,
    providerId,
    modelId,
    agents,
    sessions,
    sessionKey,
  });

  const applySessionModel = useCallback(
    async (
      nextModel: string,
      nextProviderId?: string,
      options?: { persist?: boolean },
    ) => {
      const trimmed = nextModel.trim();
      if (!trimmed || !sessionKeyRef.current) return;
      const client = clientRef.current;
      if (!client?.connected) return;

      setModelSaving(true);
      setError(null);
      try {
        await patchSessionModel(client, sessionKeyRef.current, trimmed);
        setModelId(trimmed);
        if (nextProviderId) setProviderId(nextProviderId);
        if (options?.persist !== false && projectId) {
          saveSessionModelSelection(
            projectId,
            agentIdRef.current,
            sessionKeyRef.current,
            nextProviderId ?? providerId ?? "",
            trimmed,
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : translate("chat.errors.changeModel"));
      } finally {
        setModelSaving(false);
      }
    },
    [projectId, providerId],
  );

  const applySessionThinking = useCallback(
    async (
      nextLevel: ThinkingLevel,
      options?: { persist?: boolean; sessionKey?: string },
    ) => {
      const key = (options?.sessionKey ?? sessionKeyRef.current).trim();
      if (!key) return;
      const client = clientRef.current;
      if (!client?.connected) return;

      setThinkingSaving(true);
      setError(null);
      try {
        await patchSessionThinking(client, key, nextLevel);
        setThinkingLevel(nextLevel);
        if (options?.persist !== false && projectId) {
          saveSessionThinkingSelection(
            projectId,
            agentIdRef.current,
            key,
            nextLevel,
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : translate("chat.errors.changeThinking"),
        );
      } finally {
        setThinkingSaving(false);
      }
    },
    [projectId],
  );

  useEffect(() => {
    if (!projectId) return;

    void chatApi
      .listModels(projectId, agentId)
      .then((res) => {
        setModelOptions(res);
      })
      .catch((err) => {
        setModelOptions({
          primaryModel: null,
          agentPrimaryModel: null,
          providers: [],
        });
        setError(
          err instanceof Error ? err.message : translate("chat.errors.loadModelCatalog"),
        );
      })
      .finally(() => setModelsLoading(false));
  }, [projectId, agentId]);

  const defaultModelSelection = useMemo(() => {
    if (!projectId || !modelOptions || modelsLoading) {
      return { providerId: undefined, modelId: undefined };
    }
    const stored = loadSessionModelSelection(projectId, agentId, sessionKey);
    const target =
      stored?.modelId?.trim() ||
      resolveAgentPrimaryOpenClawId(modelOptions)?.trim() ||
      modelOptions.primaryModel?.trim() ||
      "";
    return resolveModelSelection(modelOptions, target);
  }, [projectId, agentId, sessionKey, modelOptions, modelsLoading]);

  const modelSelectionKey = `${projectId}|${agentId}|${sessionKey}|${modelsLoading}|${defaultModelSelection.providerId}|${defaultModelSelection.modelId}`;
  const [trackedModelSelectionKey, setTrackedModelSelectionKey] =
    useState(modelSelectionKey);

  if (modelSelectionKey !== trackedModelSelectionKey) {
    setTrackedModelSelectionKey(modelSelectionKey);
    setProviderId(defaultModelSelection.providerId);
    setModelId(defaultModelSelection.modelId);
  }

  useEffect(() => {
    if (!projectId || !modelOptions || modelsLoading) return;

    const sessionModel = modelId?.trim();
    const client = clientRef.current;
    if (
      !client?.connected ||
      connectionState !== "connected" ||
      !sessionModel
    ) {
      return;
    }

    void patchSessionModel(client, sessionKey, sessionModel).catch(
      () => undefined,
    );
  }, [
    projectId,
    modelOptions,
    modelsLoading,
    modelId,
    sessionKey,
    connectionState,
  ]);

  const gatewayThinkingLevel = useMemo(() => {
    if (!projectId || !sessionKey) return DEFAULT_THINKING_LEVEL;
    const gatewayRow = sessions.find((s) => s.key === sessionKey);
    return resolveSessionThinkingLevel(
      projectId,
      agentId,
      sessionKey,
      gatewayRow?.thinkingLevel,
    );
  }, [projectId, agentId, sessionKey, sessions]);

  const thinkingSyncKey = `${projectId}|${agentId}|${sessionKey}|${gatewayThinkingLevel}`;
  const [trackedThinkingSyncKey, setTrackedThinkingSyncKey] =
    useState(thinkingSyncKey);

  if (thinkingSyncKey !== trackedThinkingSyncKey) {
    setTrackedThinkingSyncKey(thinkingSyncKey);
    setThinkingLevel(gatewayThinkingLevel);
  }

  useEffect(() => {
    if (!projectId || !sessionKey) return;

    const client = clientRef.current;
    if (!client?.connected || connectionState !== "connected") {
      return;
    }

    void patchSessionThinking(client, sessionKey, gatewayThinkingLevel).catch(
      () => undefined,
    );
  }, [projectId, sessionKey, gatewayThinkingLevel, connectionState]);

  const handleProviderChange = (nextProviderId: string) => {
    setProviderId(nextProviderId);
    const provider = modelOptions?.providers.find(
      (p) => p.providerId === nextProviderId,
    );
    const nextModel =
      provider?.defaultModel ?? provider?.models[0]?.openclawId ?? "";
    if (nextModel) {
      void applySessionModel(nextModel, nextProviderId);
    } else {
      setModelId("");
    }
  };

  const handleModelChange = (nextModel: string) => {
    setModelId(nextModel);
    void applySessionModel(nextModel);
  };

  const handleThinkingChange = (nextLevel: string) => {
    const level = normalizeThinkingLevel(nextLevel);
    if (!level) return;
    void applySessionThinking(level);
  };

  const handleAgentChange = (nextAgentId: string) => {
    if (sending) return;
    setAgentId(nextAgentId);
    resetSessionSearch();
    autoTitledSessionsRef.current.clear();
    if (projectId) {
      saveLastAgentId(projectId, nextAgentId);
      const nextKey = resolveInitialSessionKey(projectId, nextAgentId);
      setSessionKey(nextKey);
    }
  };

  const handleSelectSession = useCallback(
    (key: string) => {
      if (sending || key === sessionKey) return;
      setSessionKey(key);
      if (projectId) saveLastSessionKey(projectId, agentId, key);
      setStreamText("");
      streamRef.current = "";
      setSending(false);
      setError(null);
    },
    [sending, sessionKey, projectId, agentId],
  );

  const handleNewSession = useCallback(async () => {
    const client = clientRef.current;
    if (!client?.connected || creatingSession || sending) return;
    setCreatingSession(true);
    setError(null);
    try {
      const label = allocateNewSessionLabel(sessions, agentId);
      const res = await client.request<SessionsCreateResult>(
        "sessions.create",
        { agentId, label },
      );
      const key = res.key?.trim();
      if (!key) throw new Error(translate("chat.errors.noSessionKey"));
      patchedSessionLabelsRef.current.set(key, label);
      setSessionKey(key);
      if (projectId) saveLastSessionKey(projectId, agentId, key);
      setMessages([]);
      setStreamText("");
      streamRef.current = "";
      setSending(false);
      const primary = agentPrimaryModel?.trim();
      if (primary) {
        await patchSessionModel(client, key, primary).catch(() => undefined);
        const selection = resolveModelSelection(modelOptions, primary);
        setProviderId(selection.providerId);
        setModelId(selection.modelId);
        if (projectId) {
          clearSessionModelSelection(projectId, agentId, key);
        }
      }
      setThinkingLevel(DEFAULT_THINKING_LEVEL);
      if (projectId) {
        clearSessionThinkingSelection(projectId, agentId, key);
        saveSessionThinkingSelection(
          projectId,
          agentId,
          key,
          DEFAULT_THINKING_LEVEL,
        );
      }
      await patchSessionThinking(client, key, DEFAULT_THINKING_LEVEL).catch(
        () => undefined,
      );
      await loadSessions(client, agentId, debouncedSessionSearchRef.current);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : translate("chat.errors.createSession"),
      );
    } finally {
      setCreatingSession(false);
    }
  }, [
    agentId,
    agentPrimaryModel,
    creatingSession,
    sending,
    projectId,
    modelOptions,
    loadSessions,
    sessions,
    debouncedSessionSearchRef,
  ]);

  const handleRenameSession = useCallback(
    async (key: string, label: string) => {
      const client = clientRef.current;
      if (!client?.connected) return;
      const trimmed = label.trim();
      if (!trimmed) return;
      setError(null);
      const prevUpdatedAt =
        sessions.find((session) => session.key === key)?.updatedAt ?? null;
      patchedSessionLabelsRef.current.set(key, trimmed);
      if (prevUpdatedAt != null) {
        sessionSortPreserveRef.current.set(key, prevUpdatedAt);
      }
      try {
        await client.request("sessions.patch", { key, label: trimmed });
        autoTitledSessionsRef.current.add(key);
        await loadSessions(client, agentId, debouncedSessionSearchRef.current);
      } catch (err) {
        patchedSessionLabelsRef.current.delete(key);
        sessionSortPreserveRef.current.delete(key);
        setError(
          err instanceof Error ? err.message : translate("chat.errors.renameSession"),
        );
        throw err;
      }
    },
    [agentId, loadSessions, sessions, debouncedSessionSearchRef],
  );

  const handleDeleteSession = useCallback(
    async (key: string) => {
      const client = clientRef.current;
      if (!client?.connected) return;
      if (isMainSessionKey(key, agentId)) {
        setError(translate("chat.errors.cannotDeleteMain"));
        return;
      }
      setError(null);
      try {
        await client.request("sessions.delete", {
          key,
          deleteTranscript: true,
        });
        autoTitledSessionsRef.current.delete(key);
        if (sessionKeyRef.current === key) {
          const fallbackKey = sessionKeyForAgent(agentId);
          setSessionKey(fallbackKey);
          if (projectId) saveLastSessionKey(projectId, agentId, fallbackKey);
          setMessages([]);
          setStreamText("");
          streamRef.current = "";
          setSending(false);
        }
        await loadSessions(client, agentId, debouncedSessionSearchRef.current);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : translate("chat.errors.deleteSession"),
        );
        throw err;
      }
    },
    [agentId, projectId, loadSessions, debouncedSessionSearchRef],
  );

  const maybeAutoTitleSession = useCallback(
    async (text: string, key: string) => {
      if (autoTitledSessionsRef.current.has(key)) return;
      const row = sessions.find((s) => s.key === key);
      if (!isAutoTitleCandidate(key, row)) return;
      const title = deriveAutoTitleFromMessage(text);
      if (!title) return;

      autoTitledSessionsRef.current.add(key);
      const client = clientRef.current;
      if (!client?.connected) {
        autoTitledSessionsRef.current.delete(key);
        return;
      }
      try {
        await client.request("sessions.patch", { key, label: title });
        await loadSessions(
          client,
          agentIdRef.current,
          debouncedSessionSearchRef.current,
        );
      } catch {
        autoTitledSessionsRef.current.delete(key);
      }
    },
    [sessions, loadSessions, debouncedSessionSearchRef],
  );

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (project && shouldRedirectToSetup(project)) {
      router.replace(SETUP_PATH);
    }
  }, [project, router]);

  const [trackedStatusProjectId, setTrackedStatusProjectId] =
    useState(projectId);
  if (projectId !== trackedStatusProjectId) {
    setTrackedStatusProjectId(projectId);
    setStatusLoading(Boolean(projectId));
  }

  useEffect(() => {
    if (!projectId) return;

    void chatApi
      .status(projectId)
      .then((s) => {
        setReady(s.ready);
        setAgents(s.agents);
        const savedAgentId = loadLastAgentId(projectId);
        const nextAgentId =
          savedAgentId && s.agents.some((a) => a.id === savedAgentId)
            ? savedAgentId
            : s.defaultAgentId;
        setAgentId(nextAgentId);
        setSessionKey(resolveInitialSessionKey(projectId, nextAgentId));
        if (!s.ready) {
          router.replace(SETUP_PATH);
        }
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : translate("chat.errors.loadStatus"),
        );
      })
      .finally(() => setStatusLoading(false));
  }, [projectId, router]);

  useEffect(() => {
    if (!ready || !projectId) return undefined;
    void (async () => {
      await Promise.resolve();
      connectChat();
    })();
    return () => {
      clientRef.current?.disconnect();
    };
  }, [ready, projectId, connectChat]);

  useEffect(() => {
    const client = clientRef.current;
    if (!client?.connected || connectionState !== "connected") return;
    void loadSessions(client, agentId, debouncedSessionSearch);
  }, [agentId, connectionState, debouncedSessionSearch, loadSessions]);

  useEffect(() => {
    const client = clientRef.current;
    if (!client?.connected || connectionState !== "connected" || !sessionKey)
      return;
    setStreamText("");
    streamRef.current = "";
    if (!sendingRef.current) {
      setMessages([]);
    }
    void loadHistory(client, sessionKey).catch((err) => {
      if (sessionKeyRef.current !== sessionKey) return;
      setError(
        err instanceof Error ? err.message : translate("chat.errors.loadHistory"),
      );
    });
  }, [sessionKey, connectionState, loadHistory]);

  const handleSend = async (payload: ComposerSendPayload) => {
    const text = payload.text.trim();
    const attachments = payload.attachments;
    const attachmentIds = attachments
      .map((item) => item.serverId)
      .filter((id): id is string => Boolean(id));
    const client = clientRef.current;
    if (
      (!text && attachmentIds.length === 0) ||
      !client?.connected ||
      sending
    ) {
      return;
    }

    if (
      sandboxActive &&
      attachments.some((item) =>
        isFileOverSandboxStagingLimit(item.file.size, true),
      )
    ) {
      setError(
        `File exceeds ${Math.round(SANDBOX_STAGING_MAX_BYTES / (1024 * 1024))} MB — sandbox is enabled.`,
      );
      return;
    }

    const messageText =
      text ||
      (attachmentIds.length > 0
        ? attachments.map((item) => item.file.name).join(", ")
        : "");

    setInput("");
    sendingRef.current = true;
    setSending(true);
    setError(null);
    resetToolStream();
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", text: messageText },
    ]);
    void maybeAutoTitleSession(messageText, sessionKey);
    const runId = crypto.randomUUID();
    try {
      await client.request("chat.send", {
        sessionKey,
        message: messageText,
        deliver: false,
        idempotencyKey: runId,
        attachmentIds,
      });
    } catch (err) {
      sendingRef.current = false;
      setSending(false);
      setError(err instanceof Error ? err.message : translate("chat.errors.sendMessage"));
    }
  };

  const handleAbort = async () => {
    const client = clientRef.current;
    if (!client?.connected) return;
    try {
      await client.request("chat.abort", { sessionKey });
    } catch {
      /* ignore */
    }
    sendingRef.current = false;
    setSending(false);
    setStreamText("");
    resetToolStream();
  };

  const openSetup = useCallback(() => {
    router.replace(SETUP_PATH);
  }, [router]);

  const sessionSidebarDisabled =
    connectionState !== "connected" || statusLoading || creatingSession;

  return {
    project,
    projectId,
    hasProject: Boolean(projectId),
    sessions,
    sessionsLoading,
    creatingSession,
    sessionKey,
    agentId,
    sidebarCollapsed,
    sessionSearch,
    setSessionSearch,
    sessionSidebarDisabled,
    handleToggleSidebar,
    handleSelectSession,
    handleNewSession,
    handleRenameSession,
    handleDeleteSession,
    ready,
    statusLoading,
    connectionState,
    error,
    connectChat,
    openSetup,
    agentOptions,
    handleAgentChange,
    thinkingLevel,
    thinkingSelectOptions,
    handleThinkingChange,
    thinkingSaving,
    providerId,
    providerSelectOptions,
    handleProviderChange,
    modelId,
    modelSelectOptions,
    handleModelChange,
    modelsLoading,
    modelSaving,
    hasProviders,
    messages,
    streamText,
    sending,
    input,
    setInput,
    handleSend,
    handleAbort,
    sandboxActive,
    stagingMaxBytes,
    activeContextUsage,
    liveItems,
    showToolPreparing,
    modelHint,
    invokableSkills,
    invokableSkillsLoading,
  };
}
