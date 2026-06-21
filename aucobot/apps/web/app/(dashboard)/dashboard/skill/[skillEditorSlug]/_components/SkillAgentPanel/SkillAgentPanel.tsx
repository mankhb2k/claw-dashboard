"use client";

import { RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";

import styles from "./SkillAgentPanel.module.css";
import panelStyles from "./SkillAgentPanelLayout.module.css";
import { SkillAgentPanelNoModelBanner } from "./SkillAgentPanelModelBar";
import barStyles from "./SkillAgentPanelModelBar.module.css";
import { ChatMessageBubble } from "@/app/(dashboard)/dashboard/chat/_components/ChatMessageBubble/ChatMessageBubble";
import { MessageBox } from "@/components/chat/MessageBox";
import { Box, Flex } from "@/components/layout";
import { Typography, Button, Spinner } from "@/components/ui";
import { useSkillModelSelect } from "@/hooks/skill/use-skill-model-select";
import { projectApi } from "@/lib/api/project";
import { useProjectStore } from "@/stores/project.store";
import { useSkillEditorStore } from "@/stores/skill/skill-editor.store";

const QUICK_PROMPTS = [
  {
    id: "lookup",
    label: "Write lookup guide",
    message:
      "Write a skill that guides the agent to look up product or service information.",
  },
  {
    id: "errors",
    label: "Add error handling",
    message:
      "Add error-handling steps and fallbacks when data cannot be found.",
  },
  {
    id: "review",
    label: "Review current skill",
    message:
      "Review and improve the current skill: clearer, complete steps, easier for the agent to execute.",
  },
  {
    id: "template",
    label: "New skill template",
    message:
      "Write a new skill from scratch with: goal, trigger conditions, and execution steps.",
  },
] as const;

const WELCOME_MESSAGE = {
  id: "welcome",
  role: "assistant" as const,
  content:
    "Hi! I can **write or edit skills** directly in the editor on the left.\n\nDescribe the skill you want — AI will update the content and save automatically.",
};

type PanelChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function renderSimpleMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`md-bold:${part}`}>{part.slice(2, -2)}</strong>;
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

export type SkillAgentPanelProps = {
  onApplyMarkdown: (markdown: string) => void | Promise<void>;
};

export function SkillAgentPanel({ onApplyMarkdown }: SkillAgentPanelProps) {
  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");
  const skillSnapshot = useSkillEditorStore((s) => s.skillSnapshot);
  const pendingPanelMessage = useSkillEditorStore(
    (s) => s.pendingPanelMessage,
  );
  const clearPendingPanelMessage = useSkillEditorStore(
    (s) => s.clearPendingPanelMessage,
  );

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
  } = useSkillModelSelect(projectId);

  const [messages, setMessages] = useState<PanelChatMessage[]>([
    WELCOME_MESSAGE,
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [apiError, setApiError] = useState<React.ReactNode | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, apiError, scrollToBottom]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;

      if (!hasProviders || !providerId || !modelId || !projectId) {
        setApiError(
          <>
            Select a provider and model first.{" "}
            <Link href="/dashboard/ai-model">Connect AI Model</Link>
          </>,
        );
        return;
      }

      if (!skillSnapshot) {
        setApiError("No skill data available for AI to reference.");
        return;
      }

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
        const res = await projectApi.skillAiEditorComplete(projectId, {
          providerId,
          model: modelId,
          messages: nextMessages.map(({ role, content }) => ({
            role,
            content,
          })),
          skillContext: {
            slug: skillSnapshot.slug,
            name: skillSnapshot.name,
            description: skillSnapshot.description,
            heading: skillSnapshot.heading,
            currentBodyMarkdown: skillSnapshot.bodyMarkdown,
          },
        });

        await onApplyMarkdown(res.markdown);
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content:
              "Editor updated. You can keep editing on the left before enabling the skill.",
          },
        ]);
      } catch (err) {
        setApiError(formatApiError(err, providerId));
      } finally {
        setIsTyping(false);
      }
    },
    [
      isTyping,
      hasProviders,
      providerId,
      modelId,
      projectId,
      skillSnapshot,
      messages,
      onApplyMarkdown,
    ],
  );

  useEffect(() => {
    if (!pendingPanelMessage) return;
    const message = pendingPanelMessage;
    clearPendingPanelMessage();
    void (async () => {
      await Promise.resolve();
      await sendMessage(message);
    })();
  }, [pendingPanelMessage, sendMessage, clearPendingPanelMessage]);

  const resetChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setIsTyping(false);
    setInput("");
    setApiError(null);
  };

  const inputDisabled =
    isTyping || modelsLoading || !hasProviders || !skillSnapshot;

  return (
    <Flex direction="column" fullWidth fullHeight className={panelStyles.root}>
      <Flex justify="between" align="center" className={panelStyles.header}>
        <Flex align="center" gap={8}>
          <Sparkles size={18} aria-hidden className={panelStyles.headerIcon} />
          <Flex direction="column" gap={2}>
            <Typography variant="p" weight="bold">
              Skill assistant
            </Typography>
            <Typography variant="xs" color="muted">
              {skillSnapshot?.name
                ? `Editing: ${skillSnapshot.name}`
                : "AI writes skills directly into the editor"}
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

      <Flex gap={8} className={styles.quickPrompts}>
        {QUICK_PROMPTS.map((prompt) => (
          <Button
            key={prompt.id}
            type="button"
            variant="outline"
            size="sm"
            className={styles.quickChip}
            disabled={isTyping}
            onClick={() => void sendMessage(prompt.message)}
          >
            {prompt.label}
          </Button>
        ))}
      </Flex>

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
                </Box>
              </Flex>
            ),
          )}
          {isTyping ? (
            <Flex align="start" gap={12} className={panelStyles.typingRow}>
              <Box border radius="lg" color="surface" p={12}>
                <Flex align="center" gap={8}>
                  <Spinner size="sm" />
                  <Typography variant="small" color="muted">
                    AI is writing the skill…
                  </Typography>
                </Flex>
              </Box>
            </Flex>
          ) : null}
          <div ref={chatEndRef} />
        </div>
      </div>

      <div className={panelStyles.composerFooter}>
        {!modelsLoading && !hasProviders ? (
          <SkillAgentPanelNoModelBanner />
        ) : null}
        <MessageBox
          value={input}
          onChange={setInput}
          onSend={() => void sendMessage(input)}
          sending={isTyping}
          disabled={inputDisabled}
          placeholder="Ask AI to write or edit the skill…"
          providerId={providerId}
          providerOptions={providerSelectOptions}
          onProviderChange={handleProviderChange}
          modelId={modelId}
          modelOptions={modelSelectOptions}
          onModelChange={handleModelChange}
          modelsLoading={modelsLoading}
          inputId="skill-panel-message-input"
          composerId="skill-panel-composer"
          ariaLabel="Skill assistant message input"
          hint="Each message replaces the editor content and saves automatically. Review before enabling the skill."
        />
      </div>
    </Flex>
  );
}
