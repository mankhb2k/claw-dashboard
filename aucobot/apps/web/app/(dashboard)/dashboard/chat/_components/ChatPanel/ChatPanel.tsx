"use client";

import { AlertCircle, MessageSquare, RefreshCw } from "lucide-react";
import Link from "next/link";

import styles from "./ChatPanel.module.css";
import { ChatLiveThread } from "../ChatLiveThread/ChatLiveThread";
import { ChatMessageBubble } from "../ChatMessageBubble/ChatMessageBubble";
import { ContentArea } from "../ContentArea/ContentArea";
import {
  MessageBox,
  type ComposerSendPayload,
} from "@/components/chat/MessageBox";
import { Box } from "@/components/layout";
import { Button, Select } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { isOssRuntime } from "@/lib/runtime/runtime-mode";

import type { InvokableSkill } from "@/utils/chat/skill-slash";
import type { LiveThreadItem } from "@/utils/chat/tool/types";

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

const STATUS_KEYS: Record<ChatPanelConnectionState, string> = {
  idle: "chat.panel.connection.idle",
  connecting: "chat.panel.connection.connecting",
  connected: "chat.panel.connection.connected",
  error: "chat.panel.connection.error",
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
  thinkingLevel: string;
  thinkingOptions: SelectOption[];
  onThinkingChange: (level: string) => void;
  thinkingSaving?: boolean;
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
  sessionKey?: string;
  liveItems?: LiveThreadItem[];
  showToolPreparing?: boolean;
  invokableSkills?: InvokableSkill[];
  invokableSkillsLoading?: boolean;
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
  thinkingLevel,
  thinkingOptions,
  onThinkingChange,
  thinkingSaving = false,
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
  sessionKey,
  liveItems = [],
  showToolPreparing = false,
  invokableSkills,
  invokableSkillsLoading,
}: ChatPanelProps) {
  const { t } = useI18n();
  const showEmpty =
    messages.length === 0 &&
    liveItems.length === 0 &&
    !streamText &&
    !sending &&
    connectionState === "connected";

  const canSend = ready && connectionState === "connected" && !sending;

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
    <Box as="section" className={styles.panel} aria-label={t("chat.panel.ariaConversation")}>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <p className={styles.headerTitle}>{t("chat.panel.title")}</p>
          <p className={styles.headerSub}>
            {projectDisplayName ?? t("chat.panel.projectFallback")} ·{" "}
            {statusLoading
              ? t("chat.panel.checking")
              : ready
                ? t("chat.panel.gatewayReady")
                : t("chat.panel.statusLabel", {
                    status: projectStatus ?? "—",
                  })}
          </p>
        </div>

        <div className={styles.headerControls}>
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
              placeholder={t("chat.panel.selectAgent")}
            />
          </div>

          <div
            className={styles.thinkingField}
            title={t("chat.panel.thinkingTitle")}
          >
            <Select
              id="chat-thinking"
              labelPosition="none"
              value={thinkingLevel}
              onValueChange={onThinkingChange}
              options={thinkingOptions}
              disabled={controlsDisabled || thinkingSaving}
              placeholder={t("chat.panel.thinkingPlaceholder")}
            />
          </div>
        </div>

        <div className={styles.headerActions}>
          <span
            className={`${styles.statusPill} ${statusClass}`}
            title={t(STATUS_KEYS[connectionState])}
          >
            <span className={styles.statusDot} />
            {statusLoading
              ? t("chat.panel.checking")
              : t(STATUS_KEYS[connectionState])}
          </span>

          {ready && connectionState === "error" && (
            <Button size="sm" variant="outline" onClick={onConnect}>
              <RefreshCw size={14} />
              {t("chat.panel.reconnect")}
            </Button>
          )}
        </div>
      </header>

      {!modelsLoading && !hasProviders && (
        <div className={styles.modelHint} role="status">
          {t("chat.panel.noApiKey")}
          <Link href="/dashboard/ai-model/gemini">{t("chat.panel.addGeminiKey")}</Link>
          {t("chat.panel.selectModelHint")}
        </div>
      )}

      {error && (
        <div className={styles.alert} role="alert">
          <AlertCircle size={18} className={styles.alertIcon} />
          <div className={styles.alertBody}>
            <span className={styles.alertTitle}>{t("chat.panel.cannotChat")}</span>
            {error}
          </div>
          {ready && (
            <Button size="sm" variant="outline" onClick={onConnect}>
              {t("chat.panel.retry")}
            </Button>
          )}
          {!ready && (
            <Button size="sm" variant="outline" onClick={onOpenSetup}>
              {t("chat.panel.openSetup")}
            </Button>
          )}
        </div>
      )}

      <ContentArea
        scrollResetKey={sessionKey}
        emptyState={
          showEmpty ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>
                <MessageSquare size={28} />
              </div>
              <h2 className={styles.emptyTitle}>{t("chat.panel.emptyTitle")}</h2>
              <p className={styles.emptyHint}>
                {isOssRuntime()
                  ? t("chat.panel.emptyHintOss")
                  : t("chat.panel.emptyHintContainer")}{" "}
                {t("chat.panel.emptyHintKeys")}
              </p>
              <Button
                size="sm"
                onClick={onNewSession}
                disabled={sessionActionsDisabled}
              >
                {t("chat.panel.newChat")}
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
            ariaLabel={t("chat.panel.messageInputAria")}
            placeholder={
              ready && connectionState === "connected"
                ? t("chat.panel.placeholderConnected")
                : t("chat.panel.placeholderDisconnected")
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
            invokableSkills={invokableSkills}
            invokableSkillsLoading={invokableSkillsLoading}
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

        <ChatLiveThread
          liveItems={liveItems}
          showToolPreparing={showToolPreparing}
        />

        {streamText ? (
          <ChatMessageBubble role="assistant" text={streamText} streaming />
        ) : null}
      </ContentArea>
    </Box>
  );
}
