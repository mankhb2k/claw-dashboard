"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Box, Flex } from "@/components/layout";
import { Typography, Button, Spinner } from "@/components/ui";
import { RotateCcw, Sparkles } from "lucide-react";
import { ChatMessageBubble } from "@/app/(dashboard)/dashboard/chat/_components/ChatMessageBubble";
import { useAgentEditorUiStore } from "@/stores/agent-editor-ui.store";
import { useProjectStore } from "@/stores/project.store";
import { useChatModelSelect } from "@/lib/chat/use-chat-model-select";
import { projectApi } from "@/lib/api/project";
import {
  getWelcomeMessage,
  QUICK_PROMPTS,
  respondToUserMessage,
} from "@/lib/agent-editor/agent-panel-assistant";
import {
  buildAgentContextFromForm,
  OPTIMIZE_SEED_USER_MESSAGE,
} from "@/lib/agent-editor/agent-panel-context";
import { dispatchApplyAgentsMd } from "@/lib/agent-editor/agent-panel-events";
import { MessageBox } from "@/components/dashboard/MessageBox";
import { AgentPanelNoModelBanner } from "./AgentPanelModelBar";
import { OptimizeResultCard } from "./OptimizeResultCard";
import styles from "./AgentPanel.module.css";
import panelStyles from "./AgentPanelLayout.module.css";
import barStyles from "./AgentPanelModelBar.module.css";

type PanelChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  questions?: string[];
  optimizeMarkdown?: string;
  optimizeDismissed?: boolean;
};

function renderSimpleMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function formatApiError(err: unknown, providerId?: string): React.ReactNode {
  const msg = err instanceof Error ? err.message : "AI did not respond";
  const needsKey =
    msg.includes("NO_PROVIDER_KEY") ||
    msg.includes("PROVIDER_DISABLED") ||
    msg.includes("last test") ||
    msg.includes("test the key");
  if (needsKey && providerId) {
    return (
      <>
        {msg}{" "}
        <Link href={`/dashboard/ai-model/${providerId}`}>
          Open provider settings
        </Link>
      </>
    );
  }
  if (needsKey) {
    return (
      <>
        {msg}{" "}
        <Link href="/dashboard/ai-model">Connect AI Model</Link>
      </>
    );
  }
  return msg;
}

export function AgentPanel() {
  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");
  const formSnapshot = useAgentEditorUiStore((s) => s.formSnapshot);
  const activeEditTab = useAgentEditorUiStore((s) => s.activeEditTab);
  const pendingPanelMessage = useAgentEditorUiStore((s) => s.pendingPanelMessage);
  const clearPendingPanelMessage = useAgentEditorUiStore(
    (s) => s.clearPendingPanelMessage,
  );
  const optimizeMode = useAgentEditorUiStore((s) => s.optimizeMode);
  const clearOptimizeMode = useAgentEditorUiStore((s) => s.clearOptimizeMode);

  const {
    modelsLoading,
    loadError,
    providerId,
    modelId,
    providerSelectOptions,
    modelSelectOptions,
    hasProviders,
    handleProviderChange,
    handleModelChange,
  } = useChatModelSelect(projectId);

  const [messages, setMessages] = useState<PanelChatMessage[]>([
    { ...getWelcomeMessage(), optimizeDismissed: true },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [apiError, setApiError] = useState<React.ReactNode | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const optimizeStartedRef = useRef(false);
  const context = formSnapshot ?? {};

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, apiError, scrollToBottom]);

  const callAgentAi = useCallback(
    async (
      nextMessages: PanelChatMessage[],
      intent: "optimize" | "chat",
    ) => {
      if (!projectId || !providerId || !modelId) {
        throw new Error("Select a provider and model first");
      }

      const apiMessages = nextMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map(({ role, content }) => ({ role, content }));

      return projectApi.agentAiEditorComplete(projectId, {
        providerId,
        model: modelId,
        intent,
        messages: apiMessages,
        agentContext: buildAgentContextFromForm(context, activeEditTab),
      });
    },
    [projectId, providerId, modelId, context, activeEditTab],
  );

  const appendAssistantFromApi = useCallback(
    (res: Awaited<ReturnType<typeof projectApi.agentAiEditorComplete>>) => {
      const assistantMsg: PanelChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: res.message,
        questions: res.questions,
        optimizeMarkdown:
          res.phase === "optimize" ? res.markdown : undefined,
        optimizeDismissed: false,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (res.phase === "optimize") {
        clearOptimizeMode();
      }
    },
    [clearOptimizeMode],
  );

  const runApiTurn = useCallback(
    async (userText: string, intent: "optimize" | "chat") => {
      const trimmed = userText.trim();
      if (!trimmed || isTyping) return;

      const userMsg: PanelChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: trimmed,
      };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setInput("");
      setIsTyping(true);
      setApiError(null);

      try {
        const res = await callAgentAi(nextMessages, intent);
        appendAssistantFromApi(res);
      } catch (err) {
        setApiError(formatApiError(err, providerId));
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, messages, callAgentAi, appendAssistantFromApi, providerId],
  );

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;

      if (hasProviders && providerId && modelId) {
        void runApiTurn(trimmed, optimizeMode ? "optimize" : "chat");
        return;
      }

      const userMsg: PanelChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: trimmed,
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);

      window.setTimeout(() => {
        const reply = respondToUserMessage(trimmed, context, activeEditTab);
        setMessages((prev) => [
          ...prev,
          {
            ...reply,
            optimizeDismissed: true,
          },
        ]);
        setIsTyping(false);
      }, 400);
    },
    [
      activeEditTab,
      context,
      hasProviders,
      isTyping,
      modelId,
      optimizeMode,
      providerId,
      runApiTurn,
    ],
  );

  useEffect(() => {
    if (!pendingPanelMessage) return;
    sendMessage(pendingPanelMessage);
    clearPendingPanelMessage();
  }, [pendingPanelMessage, sendMessage, clearPendingPanelMessage]);

  useEffect(() => {
    if (!optimizeMode) {
      optimizeStartedRef.current = false;
      return;
    }
    if (optimizeStartedRef.current || modelsLoading) return;
    if (!hasProviders || !providerId || !modelId || !projectId) return;

    optimizeStartedRef.current = true;
    void runApiTurn(OPTIMIZE_SEED_USER_MESSAGE, "optimize");
  }, [
    optimizeMode,
    modelsLoading,
    hasProviders,
    providerId,
    modelId,
    projectId,
    runApiTurn,
  ]);

  const handleApplyOptimize = (markdown: string, messageId: string) => {
    dispatchApplyAgentsMd({ markdown, mode: "advanced" });
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, optimizeDismissed: true } : m,
      ),
    );
    clearOptimizeMode();
  };

  const dismissOptimize = (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, optimizeDismissed: true } : m,
      ),
    );
  };

  const resetChat = () => {
    setMessages([{ ...getWelcomeMessage(), optimizeDismissed: true }]);
    setIsTyping(false);
    setInput("");
    setApiError(null);
    clearOptimizeMode();
    optimizeStartedRef.current = false;
  };

  const inputDisabled =
    isTyping || (!hasProviders && optimizeMode) || modelsLoading;
  const showQuickPrompts = !optimizeMode;

  return (
    <Flex direction="column" fullWidth fullHeight className={panelStyles.root}>
      <Flex justify="between" align="center" className={panelStyles.header}>
        <Flex align="center" gap={8}>
          <Sparkles size={18} aria-hidden className={panelStyles.headerIcon} />
          <Flex direction="column" gap={2}>
            <Typography variant="p" weight="bold">
              Agent assistant
            </Typography>
            <Typography variant="xs" color="muted">
              {optimizeMode
                ? "Optimizing AGENTS.md…"
                : "Draft AGENTS.md · Bot Agent tab guidance"}
            </Typography>
          </Flex>
        </Flex>
        <Button
          type="button"
          variant="ghost"
          size="md"
          iconOnly
          title="Reset conversation"
          onClick={resetChat}
        >
          <RotateCcw size={16} />
        </Button>
      </Flex>

      {loadError ? (
        <div className={barStyles.errorBanner} role="alert">
          <div className={barStyles.errorBannerInner}>{loadError}</div>
        </div>
      ) : null}

      {apiError ? (
        <div className={barStyles.errorBanner} role="alert">
          <div className={barStyles.errorBannerInner}>{apiError}</div>
        </div>
      ) : null}

      {showQuickPrompts ? (
        <Flex gap={8} className={styles.quickPrompts}>
          {QUICK_PROMPTS.map((prompt) => (
            <Button
              key={prompt.id}
              type="button"
              variant="outline"
              size="sm"
              className={styles.quickChip}
              disabled={isTyping}
              onClick={() => sendMessage(prompt.message)}
            >
              {prompt.label}
            </Button>
          ))}
        </Flex>
      ) : null}

      <div className={panelStyles.chatScroll}>
        <div className={panelStyles.chatThread}>
          {messages.map((msg) =>
            msg.role === "user" ? (
              <ChatMessageBubble key={msg.id} role="user" text={msg.content} />
            ) : (
              <Flex
                key={msg.id}
                direction="column"
                className={panelStyles.assistantBlock}
              >
                <Box
                  border
                  radius="lg"
                  color="surface"
                  p={12}
                  className={panelStyles.assistantBubble}
                >
                  <div className={styles.assistantContent}>
                    {renderSimpleMarkdown(msg.content)}
                  </div>
                  {msg.questions?.length ? (
                    <ol className={styles.questionList}>
                      {msg.questions.map((q, idx) => (
                        <li key={idx}>{q}</li>
                      ))}
                    </ol>
                  ) : null}
                </Box>
                {msg.optimizeMarkdown && !msg.optimizeDismissed ? (
                  <OptimizeResultCard
                    markdown={msg.optimizeMarkdown}
                    summary={msg.content}
                    onApply={() =>
                      handleApplyOptimize(msg.optimizeMarkdown!, msg.id)
                    }
                    onDismiss={() => dismissOptimize(msg.id)}
                  />
                ) : null}
              </Flex>
            ),
          )}
          {isTyping ? (
            <Flex align="start" gap={12} className={panelStyles.typingRow}>
              <Box border radius="lg" color="surface" p={12}>
                <Flex align="center" gap={8}>
                  <Spinner size="sm" />
                  <Typography variant="small" color="muted">
                    {optimizeMode ? "AI is analyzing…" : "Drafting…"}
                  </Typography>
                </Flex>
              </Box>
            </Flex>
          ) : null}
          <div ref={chatEndRef} />
        </div>
      </div>

      <div className={panelStyles.composerFooter}>
        {!modelsLoading && !hasProviders ? <AgentPanelNoModelBanner /> : null}
        <MessageBox
          value={input}
          onChange={setInput}
          onSend={() => sendMessage(input)}
          sending={isTyping}
          disabled={inputDisabled}
          placeholder={
            optimizeMode
              ? "Answer the AI's questions to finish AGENTS.md…"
              : "Describe the agent, ask about a tab, or request AGENTS.md…"
          }
          providerId={providerId}
          providerOptions={providerSelectOptions}
          onProviderChange={handleProviderChange}
          modelId={modelId}
          modelOptions={modelSelectOptions}
          onModelChange={handleModelChange}
          modelsLoading={modelsLoading}
          inputId="agent-panel-message-input"
          composerId="agent-panel-composer"
          ariaLabel="Agent assistant message input"
          hint={`Left tab: ${activeEditTab}. ${
            hasProviders
              ? "Optimize with AI uses the selected model."
              : "Add an API key to use AI."
          }`}
        />
      </div>
    </Flex>
  );
}
