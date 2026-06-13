"use client";

import Link from "next/link";
import {
  AlertCircle,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { Box } from "@/components/layout";
import { Button, Select } from "@/components/ui";
import { isOssRuntime } from "@/lib/runtime/runtime-mode";
import { ChatMessageBubble } from "../ChatMessageBubble/ChatMessageBubble";
import { ChatTypingIndicator } from "../ChatTypingIndicator/ChatTypingIndicator";
import { ContentArea } from "../ContentArea/ContentArea";
import {
  MessageBox,
  type ComposerSendPayload,
} from "@/components/dashboard/MessageBox";
import styles from "./ChatPanel.module.css";

export type ChatPanelMessage = {
  id: string;
  role: string;
  text: string;
};

export type ChatPanelConnectionState =
  | "idle"
  | "connecting"
  | "connected"
  | "error";

type SelectOption = {
  value: string;
  label: string;
};

const STATUS_LABEL: Record<ChatPanelConnectionState, string> = {
  idle: "Waiting to connect",
  connecting: "Connecting…",
  connected: "Connected",
  error: "Connection error",
};

export type ChatPanelProps = {
  projectDisplayName?: string;
  projectStatus?: string;
  ready: boolean;
  statusLoading: boolean;
  connectionState: ChatPanelConnectionState;
  error: string | null;
  onConnect: () => void;
  onOpenSetup: () => void;
  agentId: string;
  agentOptions: SelectOption[];
  onAgentChange: (agentId: string) => void;
  providerId?: string;
  providerOptions: SelectOption[];
  onProviderChange: (providerId: string) => void;
  modelId?: string;
  modelOptions: SelectOption[];
  onModelChange: (model: string) => void;
  modelsLoading: boolean;
  modelSaving: boolean;
  modelHint?: string;
  hasProviders: boolean;
  messages: ChatPanelMessage[];
  streamText: string;
  sending: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onSend: (payload: ComposerSendPayload) => void;
  onAbort: () => void;
  sessionActionsDisabled: boolean;
  onNewSession: () => void;
  projectId?: string;
  sandboxActive?: boolean;
  stagingMaxBytes?: number;
  contextUsage?: {
    totalTokens?: number;
    contextTokens?: number;
    totalTokensFresh?: boolean;
    compactionCount?: number;
  };
};

export function ChatPanel({
  projectDisplayName,
  projectStatus,
  ready,
  statusLoading,
  connectionState,
  error,
  onConnect,
  onOpenSetup,
  agentId,
  agentOptions,
  onAgentChange,
  providerId,
  providerOptions,
  onProviderChange,
  modelId,
  modelOptions,
  onModelChange,
  modelsLoading,
  modelSaving,
  modelHint,
  hasProviders,
  messages,
  streamText,
  sending,
  input,
  onInputChange,
  onSend,
  onAbort,
  sessionActionsDisabled,
  onNewSession,
  projectId,
  sandboxActive,
  stagingMaxBytes,
  contextUsage,
}: ChatPanelProps) {
  const showEmpty =
    messages.length === 0 &&
    !streamText &&
    !sending &&
    connectionState === "connected";

  const canSend =
    ready &&
    connectionState === "connected" &&
    !sending;

  const controlsDisabled =
    connectionState === "connecting" || sending || statusLoading;

  const statusClass =
    connectionState === "connected"
      ? styles.statusConnected
      : connectionState === "connecting"
        ? styles.statusConnecting
        : connectionState === "error"
          ? styles.statusError
          : styles.statusIdle;

  return (
    <Box as="section" className={styles.panel} aria-label="Chat conversation">
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <p className={styles.headerTitle}>OpenClaw Chat</p>
          <p className={styles.headerSub}>
            {projectDisplayName ?? "Project"} ·{" "}
            {statusLoading
              ? "Checking…"
              : ready
                ? "Gateway ready"
                : `Status: ${projectStatus ?? "—"}`}
          </p>
        </div>

        <div className={styles.agentField}>
          <Select
            id="chat-agent"
            labelPosition="none"
            value={agentId}
            onValueChange={onAgentChange}
            options={
              agentOptions.length
                ? agentOptions
                : [{ value: "main", label: "main" }]
            }
            disabled={controlsDisabled}
            placeholder="Select agent"
          />
        </div>

        <div className={styles.headerActions}>
          <span
            className={`${styles.statusPill} ${statusClass}`}
            title={STATUS_LABEL[connectionState]}
          >
            <span className={styles.statusDot} />
            {statusLoading ? "Checking…" : STATUS_LABEL[connectionState]}
          </span>

          {ready && connectionState === "error" && (
            <Button size="sm" variant="outline" onClick={onConnect}>
              <RefreshCw size={14} />
              Reconnect
            </Button>
          )}
        </div>
      </header>

      {!modelsLoading && !hasProviders && (
        <div className={styles.modelHint} role="status">
          No LLM API key yet.{" "}
          <Link href="/dashboard/ai-model/gemini">Add a Gemini API key</Link>{" "}
          and select a model in the composer below.
        </div>
      )}

      {error && (
        <div className={styles.alert} role="alert">
          <AlertCircle size={18} className={styles.alertIcon} />
          <div className={styles.alertBody}>
            <span className={styles.alertTitle}>Cannot chat</span>
            {error}
          </div>
          {ready && (
            <Button size="sm" variant="outline" onClick={onConnect}>
              Retry
            </Button>
          )}
          {!ready && (
            <Button size="sm" variant="outline" onClick={onOpenSetup}>
              Open setup
            </Button>
          )}
        </div>
      )}

      <ContentArea
        emptyState={
          showEmpty ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>
                <MessageSquare size={28} />
              </div>
              <h2 className={styles.emptyTitle}>Start a conversation</h2>
              <p className={styles.emptyHint}>
                {isOssRuntime()
                  ? "Send a message to chat with your OpenClaw agent via the shared gateway."
                  : "Send a message to chat with your OpenClaw agent on your container."}{" "}
                Press Enter to send, Shift+Enter for a new line.
              </p>
              <Button
                size="sm"
                onClick={onNewSession}
                disabled={sessionActionsDisabled}
              >
                New chat
              </Button>
            </div>
          ) : undefined
        }
        footer={
          <MessageBox
            enableAttachments
            value={input}
            onChange={onInputChange}
            onSend={onSend}
            onAbort={onAbort}
            sending={sending}
            canSend={canSend}
            disabled={!ready || connectionState !== "connected"}
            inputId="chat-message-input"
            composerId="chat-composer"
            ariaLabel="Chat message input"
            placeholder={
              ready && connectionState === "connected"
                ? "Type a message…"
                : "Connect to the gateway to chat…"
            }
            providerId={providerId}
            providerOptions={providerOptions}
            onProviderChange={onProviderChange}
            modelId={modelId}
            modelOptions={modelOptions}
            onModelChange={onModelChange}
            modelsLoading={modelsLoading}
            modelSaving={modelSaving}
            hint={modelHint}
            modelLabel={
              modelOptions.find((m) => m.value === modelId)?.label ?? modelId
            }
            contextUsage={contextUsage}
            projectId={projectId}
            sandboxActive={sandboxActive}
            stagingMaxBytes={stagingMaxBytes}
          />
        }
      >
        {messages.map((message) => (
          <ChatMessageBubble
            key={message.id}
            role={message.role}
            text={message.text}
          />
        ))}

        {streamText && (
          <ChatMessageBubble role="assistant" text={streamText} streaming />
        )}

        {sending && !streamText && <ChatTypingIndicator />}
      </ContentArea>
    </Box>
  );
}
