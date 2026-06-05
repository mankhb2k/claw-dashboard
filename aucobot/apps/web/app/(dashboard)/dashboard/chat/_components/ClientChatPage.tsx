"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  MessageSquare,
  RefreshCw,
  Send,
  Square,
} from "lucide-react";
import { SETUP_PATH, shouldRedirectToSetup } from "@/lib/entry-route";
import { isOssRuntime } from "@/lib/runtime-mode";
import { useProjectStore } from "@/stores/project.store";
import { chatApi, type ChatModelsResponse } from "@/lib/api/chat";
import {
  ProjectChatClient,
  type GatewayEventFrame,
} from "@/lib/chat/project-chat-client";
import {
  extractText,
  roleOf,
  stableMessageId,
} from "@/lib/chat/message-extract";
import {
  loadLastAgentId,
  loadLastSessionKey,
  loadSidebarCollapsed,
  saveLastAgentId,
  saveLastSessionKey,
  saveSidebarCollapsed,
} from "@/lib/chat/last-session-key";
import {
  deriveAutoTitleFromMessage,
  isAutoTitleCandidate,
} from "@/lib/chat/session-auto-title";
import {
  DEFAULT_NEW_SESSION_LABEL,
  filterSessionsForChatSidebar,
  isBrowsableChatSession,
  isMainSessionKey,
  reconcilePatchedSessionLabels,
} from "@/lib/chat/session-display";
import type {
  GatewaySessionRow,
  SessionsCreateResult,
  SessionsListResult,
} from "@/lib/chat/session-types";
import { matchesSessionKey, sessionKeyForAgent } from "@/lib/chat/session-key";
import { Button, Select, Spinner } from "@/components/ui";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { ChatSidebar } from "./ChatSidebar/ChatSidebar";
import { ChatTypingIndicator } from "./ChatTypingIndicator";
import styles from "./ClientChatPage.module.css";

type ChatRow = {
  id: string;
  role: string;
  text: string;
};

type ConnectionState = "idle" | "connecting" | "connected" | "error";

const STATUS_LABEL: Record<ConnectionState, string> = {
  idle: "Chờ kết nối",
  connecting: "Đang kết nối…",
  connected: "Đã kết nối",
  error: "Lỗi kết nối",
};

const SESSIONS_LIST_LIMIT = 50;

const HIDDEN_HISTORY_ROLES = new Set(["tool", "toolresult", "system"]);

function rowFromMessage(message: unknown, index: number): ChatRow | null {
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
  const [messages, setMessages] = useState<ChatRow[]>([]);
  const [streamText, setStreamText] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<ProjectChatClient | null>(null);
  const streamRef = useRef("");
  const sessionKeyRef = useRef(sessionKey);
  const agentIdRef = useRef(agentId);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
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
      const rows: ChatRow[] = [];
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
          err instanceof Error ? err.message : "Không tải danh sách phiên",
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
          setError("Agent trả lỗi khi xử lý tin nhắn");
        } else if (payload.state === "aborted") {
          setSending(false);
          setStreamText("");
        }
      },
      onClose: ({ code, reason }) => {
        if (code === 1008) {
          setConnectionState("error");
          setError(
            "WebSocket bị từ chối (hết phiên đăng nhập). Đăng xuất rồi đăng nhập lại, hoặc F5 trang.",
          );
          return;
        }
        if (code === 1013 || reason.includes("not running")) {
          setConnectionState("error");
          setError("Gateway chưa sẵn sàng. Đợi vài giây rồi bấm Thử lại.");
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

  const applyModel = useCallback(
    async (nextModel: string, nextProviderId?: string) => {
      if (!projectId || !nextModel.trim()) return;
      setModelSaving(true);
      setError(null);
      try {
        const res = await chatApi.setModel(projectId, {
          agentId,
          model: nextModel.trim(),
        });
        setModelId(res.model);
        if (nextProviderId) setProviderId(nextProviderId);
        setModelOptions((prev) =>
          prev ? { ...prev, primaryModel: res.primaryModel } : prev,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không đổi model");
      } finally {
        setModelSaving(false);
      }
    },
    [projectId, agentId],
  );

  useEffect(() => {
    if (!projectId) {
      setModelsLoading(false);
      return;
    }
    setModelsLoading(true);
    void chatApi
      .listModels(projectId)
      .then((res) => {
        setModelOptions(res);
        const primary = res.primaryModel?.trim();
        const provider =
          res.providers.find((p) =>
            p.models.some((m) => m.openclawId === primary),
          ) ?? res.providers[0];
        if (provider) {
          setProviderId(provider.providerId);
          const model =
            primary && provider.models.some((m) => m.openclawId === primary)
              ? primary
              : (provider.defaultModel ?? provider.models[0]?.openclawId ?? "");
          setModelId(model);
        }
      })
      .catch((err) => {
        setModelOptions({ primaryModel: null, providers: [] });
        setError(
          err instanceof Error ? err.message : "Không tải danh sách model",
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

  const handleProviderChange = (nextProviderId: string) => {
    setProviderId(nextProviderId);
    const provider = modelOptions?.providers.find(
      (p) => p.providerId === nextProviderId,
    );
    const nextModel =
      provider?.defaultModel ?? provider?.models[0]?.openclawId ?? "";
    if (nextModel) {
      void applyModel(nextModel, nextProviderId);
    } else {
      setModelId("");
    }
  };

  const handleModelChange = (nextModel: string) => {
    setModelId(nextModel);
    void applyModel(nextModel);
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
      if (!key) throw new Error("Gateway không trả về session key");
      patchedSessionLabelsRef.current.set(key, DEFAULT_NEW_SESSION_LABEL);
      setSessionKey(key);
      if (projectId) saveLastSessionKey(projectId, agentId, key);
      setMessages([]);
      setStreamText("");
      streamRef.current = "";
      setSending(false);
      await loadSessions(client, agentId, debouncedSessionSearchRef.current);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo phiên mới");
    } finally {
      setCreatingSession(false);
    }
  }, [agentId, creatingSession, sending, projectId, loadSessions]);

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
        setError(err instanceof Error ? err.message : "Không đổi tên phiên");
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
        setError("Không thể xóa phiên chính");
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
        setError(err instanceof Error ? err.message : "Không xóa phiên");
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
          err instanceof Error ? err.message : "Không tải trạng thái chat",
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
      setError(err instanceof Error ? err.message : "Không tải lịch sử chat");
    });
  }, [sessionKey, connectionState, loadHistory]);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streamText]);

  const handleSend = async () => {
    const text = input.trim();
    const client = clientRef.current;
    if (!text || !client?.connected || sending) return;
    setInput("");
    setSending(true);
    setError(null);
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", text },
    ]);
    void maybeAutoTitleSession(text, sessionKey);
    const runId = crypto.randomUUID();
    try {
      await client.request("chat.send", {
        sessionKey,
        message: text,
        deliver: false,
        idempotencyKey: runId,
      });
    } catch (err) {
      setSending(false);
      setError(err instanceof Error ? err.message : "Gửi tin thất bại");
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

  const canSend =
    ready &&
    connectionState === "connected" &&
    !sending &&
    input.trim().length > 0;

  const statusClass =
    connectionState === "connected"
      ? styles.statusConnected
      : connectionState === "connecting"
        ? styles.statusConnecting
        : connectionState === "error"
          ? styles.statusError
          : styles.statusIdle;

  if (!projectId) {
    return (
      <div className={styles.page}>
        <p className={styles.muted}>
          Chưa có project. Tạo project tại Tổng quan trước.
        </p>
      </div>
    );
  }

  const agentOptions = agents.map((a) => ({
    value: a.id,
    label: a.name?.trim() || a.id,
  }));

  const showEmpty =
    messages.length === 0 &&
    !streamText &&
    !sending &&
    connectionState === "connected";

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

        <div className={styles.chatMain}>
          <header className={styles.header}>
            <div className={styles.headerMain}>
              <p className={styles.headerTitle}>OpenClaw Chat</p>
              <p className={styles.headerSub}>
                {project?.displayName ?? "Project"} ·{" "}
                {statusLoading
                  ? "Checking…"
                  : ready
                    ? "Gateway ready"
                    : `Status: ${project?.status ?? "—"}`}
              </p>
            </div>

            <div className={styles.agentField}>
              <Select
                id="chat-agent"
                label="Agent"
                value={agentId}
                onValueChange={handleAgentChange}
                options={
                  agentOptions.length
                    ? agentOptions
                    : [{ value: "main", label: "main" }]
                }
                disabled={
                  connectionState === "connecting" || sending || statusLoading
                }
                placeholder="Chọn agent"
              />
            </div>

            <div className={styles.agentField}>
              <Select
                id="chat-provider"
                label="Provider"
                value={providerId || undefined}
                onValueChange={handleProviderChange}
                options={providerSelectOptions}
                disabled={
                  modelsLoading ||
                  modelSaving ||
                  providerSelectOptions.length === 0 ||
                  connectionState === "connecting" ||
                  sending
                }
                placeholder={
                  modelsLoading
                    ? "Đang tải…"
                    : providerSelectOptions.length === 0
                      ? "Chưa có API key"
                      : "Chọn provider"
                }
              />
            </div>

            <div className={styles.agentField}>
              <Select
                id="chat-model"
                label="Model"
                value={modelId || undefined}
                onValueChange={handleModelChange}
                options={modelSelectOptions}
                disabled={
                  modelsLoading ||
                  modelSaving ||
                  modelSelectOptions.length === 0 ||
                  connectionState === "connecting" ||
                  sending
                }
                placeholder={
                  modelsLoading
                    ? "Đang tải…"
                    : modelSelectOptions.length === 0
                      ? "Chọn provider trước"
                      : "Chọn model"
                }
              />
            </div>

            <div className={styles.headerActions}>
              <span
                className={`${styles.statusPill} ${statusClass}`}
                title={STATUS_LABEL[connectionState]}
              >
                <span className={styles.statusDot} />
                {statusLoading
                  ? "Đang kiểm tra…"
                  : STATUS_LABEL[connectionState]}
              </span>

              {ready && connectionState === "error" && (
                <Button size="sm" variant="outline" onClick={connectChat}>
                  <RefreshCw size={14} />
                  Kết nối lại
                </Button>
              )}
            </div>
          </header>

          {!modelsLoading && (modelOptions?.providers.length ?? 0) === 0 && (
            <div className={styles.modelHint} role="status">
              Chưa có API key LLM.{" "}
              <Link href="/dashboard/ai-model/gemini">Thêm Gemini API key</Link>{" "}
              rồi chọn model bên trên.
            </div>
          )}

          {error && (
            <div className={styles.alert} role="alert">
              <AlertCircle size={18} className={styles.alertIcon} />
              <div className={styles.alertBody}>
                <span className={styles.alertTitle}>Không thể chat</span>
                {error}
              </div>
              {ready && (
                <Button size="sm" variant="outline" onClick={connectChat}>
                  Thử lại
                </Button>
              )}
              {!ready && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.replace(SETUP_PATH)}
                >
                  Mở setup
                </Button>
              )}
            </div>
          )}

          <div ref={listRef} className={styles.messagePane}>
            {showEmpty && (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>
                  <MessageSquare size={28} />
                </div>
                <h2 className={styles.emptyTitle}>Bắt đầu hội thoại</h2>
                <p className={styles.emptyHint}>
                  {isOssRuntime()
                    ? "Send a message to chat with your OpenClaw agent via the shared gateway."
                    : "Send a message to chat with your OpenClaw agent on your container."}
                  Phím Enter gửi, Shift+Enter xuống dòng.
                </p>
                <Button
                  size="sm"
                  onClick={() => void handleNewSession()}
                  disabled={sessionSidebarDisabled}
                >
                  Đoạn chat mới
                </Button>
              </div>
            )}

            {messages.map((m) => (
              <ChatMessageBubble key={m.id} role={m.role} text={m.text} />
            ))}

            {streamText && (
              <ChatMessageBubble role="assistant" text={streamText} streaming />
            )}

            {sending && !streamText && <ChatTypingIndicator />}
          </div>

          <footer className={styles.composer}>
            <div className={styles.composerBox}>
              <textarea
                ref={inputRef}
                className={styles.input}
                rows={1}
                placeholder={
                  ready && connectionState === "connected"
                    ? "Nhập tin nhắn…"
                    : "Kết nối gateway để chat…"
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                disabled={!ready || connectionState !== "connected" || sending}
              />
              <div className={styles.composerActions}>
                {sending ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleAbort()}
                    aria-label="Dừng phản hồi"
                  >
                    <Square size={16} />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => void handleSend()}
                    disabled={!canSend}
                    aria-label="Gửi tin nhắn"
                  >
                    {sending ? <Spinner size="sm" /> : <Send size={16} />}
                  </Button>
                )}
              </div>
            </div>
            <p className={styles.composerHint}>
              Enter gửi · Shift+Enter xuống dòng
              {connectionState === "connected" && (
                <>
                  {" "}
                  · session <code>{sessionKey}</code>
                </>
              )}
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
