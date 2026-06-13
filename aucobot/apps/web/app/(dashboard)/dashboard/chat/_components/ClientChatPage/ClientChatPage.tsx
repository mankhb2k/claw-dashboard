"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SETUP_PATH, shouldRedirectToSetup } from "@/lib/routing/entry-route";
import { isOssRuntime } from "@/lib/runtime/runtime-mode";
import { useProjectStore } from "@/stores/project.store";
import { chatApi, type ChatModelsResponse } from "@/lib/api/chat";
import {
  resolveAgentPrimaryOpenClawId,
  resolveModelSelection,
} from "@/utils/chat/model-catalog";
import {
  ProjectChatClient,
  type GatewayEventFrame,
} from "@/lib/chat/project-chat-client";
import { patchSessionModel } from "@/utils/chat/session-model-patch";
import {
  clearSessionModelSelection,
  loadSessionModelSelection,
  saveSessionModelSelection,
} from "@/utils/chat/session-model-storage";
import {
  extractText,
  roleOf,
  stableMessageId,
} from "@/utils/chat/message-extract";
import {
  loadLastAgentId,
  loadLastSessionKey,
  loadSidebarCollapsed,
  saveLastAgentId,
  saveLastSessionKey,
  saveSidebarCollapsed,
} from "@/utils/chat/last-session-key";
import {
  deriveAutoTitleFromMessage,
  isAutoTitleCandidate,
} from "@/utils/chat/session-auto-title";
import {
  DEFAULT_NEW_SESSION_LABEL,
  filterSessionsForChatSidebar,
  isBrowsableChatSession,
  isMainSessionKey,
  reconcilePatchedSessionLabels,
} from "@/utils/chat/session-display";
import type {
  GatewaySessionRow,
  SessionsCreateResult,
  SessionsListResult,
} from "@/utils/chat/session-types";
import { matchesSessionKey, sessionKeyForAgent } from "@/utils/chat/session-key";
import {
  isFileOverSandboxStagingLimit,
  SANDBOX_STAGING_MAX_BYTES,
} from "@/utils/chat/sandbox-staging-limit";
import { useChatSandboxContext } from "@/hooks/chat/use-chat-sandbox-context";
import {
  ChatPanel,
  type ChatPanelConnectionState,
  type ChatPanelMessage,
} from "../ChatPanel/ChatPanel";
import type { ComposerSendPayload } from "@/components/dashboard/MessageBox";
import { ChatSidebar } from "../ChatSidebar/ChatSidebar";
import styles from "./ClientChatPage.module.css";

type ConnectionState = ChatPanelConnectionState;

const SESSIONS_LIST_LIMIT = 50;

const HIDDEN_HISTORY_ROLES = new Set(["tool", "toolresult", "system"]);

function rowFromMessage(message: unknown, index: number): ChatPanelMessage | null {
  const text = extractText(message);
  if (!text?.trim()) return null;
  const role = roleOf(message);
  if (HIDDEN_HISTORY_ROLES.has(role)) return null;
  return { id: stableMessageId(message, index), role, text: text.trim() };
}

function resolveInitialSessionKey(projectId: string, agentId: string): string {
  const mainKey = sessionKeyForAgent(agentId);
  const saved = loadLastSessionKey(projectId, agentId);
  if (saved && isBrowsableChatSession(saved, agentId)) return saved;
  return mainKey;
}

export function ClientChatPage() {
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
  const [sessionKey, setSessionKey] = useState("agent:main:main");
  const [sessions, setSessions] = useState<GatewaySessionRow[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionSearch, setSessionSearch] = useState("");
  const [debouncedSessionSearch, setDebouncedSessionSearch] = useState("");
  const [creatingSession, setCreatingSession] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [modelOptions, setModelOptions] = useState<ChatModelsResponse | null>(
    null,
  );
  const [modelsLoading, setModelsLoading] = useState(true);
  const [providerId, setProviderId] = useState<string | undefined>(undefined);
  const [modelId, setModelId] = useState<string | undefined>(undefined);
  const [modelSaving, setModelSaving] = useState(false);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("idle");
  const [messages, setMessages] = useState<ChatPanelMessage[]>([]);
  const [streamText, setStreamText] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<ProjectChatClient | null>(null);
  const streamRef = useRef("");
  const sessionKeyRef = useRef(sessionKey);
  const agentIdRef = useRef(agentId);
  const historyRequestIdRef = useRef(0);
  const autoTitledSessionsRef = useRef(new Set<string>());
  const debouncedSessionSearchRef = useRef("");
  const sessionsRequestIdRef = useRef(0);
  const patchedSessionLabelsRef = useRef(new Map<string, string>());
  const sessionSortPreserveRef = useRef(new Map<string, number | null>());

  useEffect(() => {
    debouncedSessionSearchRef.current = debouncedSessionSearch;
  }, [debouncedSessionSearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSessionSearch(sessionSearch.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [sessionSearch]);

  useEffect(() => {
    sessionKeyRef.current = sessionKey;
  }, [sessionKey]);

  useEffect(() => {
    agentIdRef.current = agentId;
  }, [agentId]);

  useEffect(() => {
    if (!projectId) return;
    setSidebarCollapsed(loadSidebarCollapsed(projectId));
  }, [projectId]);

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
      const rows: ChatPanelMessage[] = [];
      const list = Array.isArray(res.messages) ? res.messages : [];
      list.forEach((msg, i) => {
        const row = rowFromMessage(msg, i);
        if (row) rows.push(row);
      });
      setMessages(rows);
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
          err instanceof Error ? err.message : "Could not load sessions",
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
            streamRef.current = t;
            setStreamText(t);
          }
        } else if (payload.state === "final") {
          const t = extractText(payload.message);
          if (t?.trim()) {
            setMessages((prev) => [
              ...prev,
              { id: `a-${Date.now()}`, role: "assistant", text: t.trim() },
            ]);
          } else if (streamRef.current.trim()) {
            setMessages((prev) => [
              ...prev,
              {
                id: `a-${Date.now()}`,
                role: "assistant",
                text: streamRef.current.trim(),
              },
            ]);
          }
          streamRef.current = "";
          setStreamText("");
          setSending(false);
          const clientNow = clientRef.current;
          if (clientNow?.connected) {
            void loadSessions(
              clientNow,
              agentIdRef.current,
              debouncedSessionSearchRef.current,
            );
          }
        } else if (payload.state === "error") {
          setSending(false);
          setStreamText("");
          setError("The agent returned an error while processing your message");
        } else if (payload.state === "aborted") {
          setSending(false);
          setStreamText("");
        }
      },
      onClose: ({ code, reason }) => {
        if (code === 1008) {
          setConnectionState("error");
          setError(
            "WebSocket rejected (session expired). Sign out and sign in again, or refresh the page.",
          );
          return;
        }
        if (code === 1013 || reason.includes("not running")) {
          setConnectionState("error");
          setError("Gateway is not ready yet. Wait a few seconds, then click Retry.");
          return;
        }
        setConnectionState("idle");
      },
      onError: (msg) => {
        setConnectionState("error");
        setError(
          msg === "WebSocket error"
            ? isOssRuntime()
              ? "Cannot reach the shared gateway. Ensure aucobot-gateway-dev is running on port 18789 and the API proxy is enabled."
              : "Cannot reach the gateway. Check the worker container and WebSocket proxy."
            : msg,
        );
      },
    });
    clientRef.current = client;
    client.connect();
  }, [projectId, ready, loadHistory, loadSessions, subscribeSessions]);

  const agentPrimaryModel = useMemo(
    () => resolveAgentPrimaryOpenClawId(modelOptions),
    [modelOptions],
  );

  const modelIsOverride = useMemo(() => {
    if (!modelId || !agentPrimaryModel) return false;
    return modelId.trim() !== agentPrimaryModel.trim();
  }, [modelId, agentPrimaryModel]);

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
        setError(err instanceof Error ? err.message : "Failed to change model");
      } finally {
        setModelSaving(false);
      }
    },
    [projectId, providerId],
  );

  useEffect(() => {
    if (!projectId) {
      setModelsLoading(false);
      return;
    }
    setModelsLoading(true);
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
          err instanceof Error ? err.message : "Failed to load model catalog",
        );
      })
      .finally(() => setModelsLoading(false));
  }, [projectId, agentId]);

  useEffect(() => {
    if (!projectId || !modelOptions || modelsLoading) return;

    const stored = loadSessionModelSelection(projectId, agentId, sessionKey);
    const target =
      stored?.modelId?.trim() ||
      agentPrimaryModel?.trim() ||
      modelOptions.primaryModel?.trim() ||
      "";
    const selection = resolveModelSelection(modelOptions, target);
    setProviderId(selection.providerId);
    setModelId(selection.modelId);

    const client = clientRef.current;
    if (!client?.connected || connectionState !== "connected" || !target) {
      return;
    }

    void patchSessionModel(client, sessionKey, target).catch(() => undefined);
  }, [
    projectId,
    agentId,
    sessionKey,
    modelOptions,
    modelsLoading,
    agentPrimaryModel,
    connectionState,
  ]);

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

  const activeContextUsage = useMemo(() => {
    const row = sessions.find((s) => s.key === sessionKey);
    if (!row) return undefined;
    return {
      totalTokens: row.totalTokens,
      contextTokens: row.contextTokens,
      totalTokensFresh: row.totalTokensFresh,
      compactionCount: row.compactionCount,
    };
  }, [sessions, sessionKey]);

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

  const handleAgentChange = (nextAgentId: string) => {
    if (sending) return;
    setAgentId(nextAgentId);
    setSessionSearch("");
    setDebouncedSessionSearch("");
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
      const res = await client.request<SessionsCreateResult>(
        "sessions.create",
        { agentId, label: DEFAULT_NEW_SESSION_LABEL },
      );
      const key = res.key?.trim();
      if (!key) throw new Error("Gateway did not return a session key");
      patchedSessionLabelsRef.current.set(key, DEFAULT_NEW_SESSION_LABEL);
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
      await loadSessions(client, agentId, debouncedSessionSearchRef.current);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create a new session");
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
        setError(err instanceof Error ? err.message : "Could not rename session");
        throw err;
      }
    },
    [agentId, loadSessions, sessions],
  );

  const handleDeleteSession = useCallback(
    async (key: string) => {
      const client = clientRef.current;
      if (!client?.connected) return;
      if (isMainSessionKey(key, agentId)) {
        setError("Cannot delete the main session");
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
        setError(err instanceof Error ? err.message : "Could not delete session");
        throw err;
      }
    },
    [agentId, projectId, loadSessions],
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
    [sessions, loadSessions],
  );

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      if (projectId) saveSidebarCollapsed(projectId, next);
      return next;
    });
  }, [projectId]);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (project && shouldRedirectToSetup(project)) {
      router.replace(SETUP_PATH);
    }
  }, [project, router]);

  useEffect(() => {
    if (!projectId) {
      setStatusLoading(false);
      return;
    }
    setStatusLoading(true);
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
          err instanceof Error ? err.message : "Could not load chat status",
        );
      })
      .finally(() => setStatusLoading(false));
  }, [projectId, router]);

  useEffect(() => {
    if (ready && projectId) connectChat();
    return () => clientRef.current?.disconnect();
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
    setMessages([]);
    void loadHistory(client, sessionKey).catch((err) => {
      if (sessionKeyRef.current !== sessionKey) return;
      setError(err instanceof Error ? err.message : "Could not load chat history");
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
    setSending(true);
    setError(null);
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
      setSending(false);
      setError(err instanceof Error ? err.message : "Failed to send message");
      return;
    }
    window.setTimeout(() => {
      setSending((active) => {
        if (!active) return active;
        void loadHistory(client, sessionKey).catch(() => undefined);
        return false;
      });
    }, 8000);
  };

  const handleAbort = async () => {
    const client = clientRef.current;
    if (!client?.connected) return;
    try {
      await client.request("chat.abort", { sessionKey });
    } catch {
      /* ignore */
    }
    setSending(false);
    setStreamText("");
  };

  if (!projectId) {
    return (
      <div className={styles.page}>
        <p className={styles.muted}>
          No project yet. Create one from Overview first.
        </p>
      </div>
    );
  }

  const agentOptions = agents.map((a) => ({
    value: a.id,
    label: a.name?.trim() || a.id,
  }));

  const sessionSidebarDisabled =
    connectionState !== "connected" || statusLoading || creatingSession;

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <ChatSidebar
          sessions={sessions}
          loading={sessionsLoading}
          creating={creatingSession}
          activeSessionKey={sessionKey}
          agentId={agentId}
          collapsed={sidebarCollapsed}
          disabled={sessionSidebarDisabled}
          searchQuery={sessionSearch}
          onSearchChange={setSessionSearch}
          onToggleCollapse={handleToggleSidebar}
          onSelectSession={handleSelectSession}
          onNewSession={() => void handleNewSession()}
          onRenameSession={handleRenameSession}
          onDeleteSession={handleDeleteSession}
        />

        <ChatPanel
          projectDisplayName={project?.displayName}
          projectStatus={project?.status}
          ready={ready}
          statusLoading={statusLoading}
          connectionState={connectionState}
          error={error}
          onConnect={connectChat}
          onOpenSetup={() => router.replace(SETUP_PATH)}
          agentId={agentId}
          agentOptions={agentOptions}
          onAgentChange={handleAgentChange}
          providerId={providerId}
          providerOptions={providerSelectOptions}
          onProviderChange={handleProviderChange}
          modelId={modelId}
          modelOptions={modelSelectOptions}
          onModelChange={handleModelChange}
          modelsLoading={modelsLoading}
          modelSaving={modelSaving}
          hasProviders={(modelOptions?.providers.length ?? 0) > 0}
          messages={messages}
          streamText={streamText}
          sending={sending}
          input={input}
          onInputChange={setInput}
          onSend={(payload) => void handleSend(payload)}
          onAbort={() => void handleAbort()}
          sessionActionsDisabled={sessionSidebarDisabled}
          onNewSession={() => void handleNewSession()}
          projectId={projectId}
          sandboxActive={sandboxActive}
          stagingMaxBytes={stagingMaxBytes}
          contextUsage={activeContextUsage}
          modelHint={
            modelIsOverride
              ? "Session only — Telegram, Discord, and other channels still use the agent default model."
              : undefined
          }
        />
      </div>
    </div>
  );
}
