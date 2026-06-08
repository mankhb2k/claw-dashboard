"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Box, Flex } from "@/components/layout";
import { Typography, Button, Spinner } from "@/components/ui";
import { RotateCcw, Sparkles } from "lucide-react";
import { ChatMessageBubble } from "@/app/(dashboard)/dashboard/chat/_components/ChatMessageBubble";
import { useSkillEditorUiStore } from "@/stores/skill-editor-ui.store";
import { useProjectStore } from "@/stores/project.store";
import { useSkillModelSelect } from "@/lib/skill/use-skill-model-select";
import { projectApi } from "@/lib/api/project";
import { SkillAgentPanelComposer } from "./SkillAgentPanelComposer";
import { SkillAgentPanelNoModelBanner } from "./SkillAgentPanelModelBar";
import styles from "./SkillAgentPanel.module.css";
import panelStyles from "./SkillAgentPanelLayout.module.css";
import barStyles from "./SkillAgentPanelModelBar.module.css";

const QUICK_PROMPTS = [
  {
    id: "lookup",
    label: "Viết hướng dẫn tra cứu",
    message:
      "Viết skill hướng dẫn agent tra cứu thông tin sản phẩm hoặc dịch vụ.",
  },
  {
    id: "errors",
    label: "Thêm bước xử lý lỗi",
    message:
      "Thêm các bước xử lý lỗi và fallback khi không tìm thấy dữ liệu.",
  },
  {
    id: "review",
    label: "Review skill hiện tại",
    message:
      "Review và cải thiện skill hiện tại: rõ ràng hơn, đủ bước, dễ agent thực thi.",
  },
  {
    id: "template",
    label: "Mẫu skill mới",
    message:
      "Viết skill mới từ đầu với cấu trúc: mục tiêu, điều kiện kích hoạt, các bước thực hiện.",
  },
] as const;

const WELCOME_MESSAGE = {
  id: "welcome",
  role: "assistant" as const,
  content:
    "Xin chào! Tôi có thể **viết hoặc chỉnh skill** trực tiếp trong editor bên trái.\n\nMô tả skill bạn muốn — AI sẽ cập nhật nội dung và tự lưu.",
};

type PanelChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
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
  const msg = err instanceof Error ? err.message : "AI không phản hồi";
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
          Mở cài đặt provider
        </Link>
      </>
    );
  }
  if (needsKey) {
    return (
      <>
        {msg}{" "}
        <Link href="/dashboard/ai-model">Kết nối AI Model</Link>
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
  const skillSnapshot = useSkillEditorUiStore((s) => s.skillSnapshot);
  const pendingPanelMessage = useSkillEditorUiStore(
    (s) => s.pendingPanelMessage,
  );
  const clearPendingPanelMessage = useSkillEditorUiStore(
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
            Chọn provider và model trước.{" "}
            <Link href="/dashboard/ai-model">Kết nối AI Model</Link>
          </>,
        );
        return;
      }

      if (!skillSnapshot) {
        setApiError("Chưa có dữ liệu skill để AI tham chiếu.");
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
              "Đã cập nhật editor. Bạn có thể chỉnh tiếp bên trái trước khi bật skill.",
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
    void sendMessage(pendingPanelMessage);
    clearPendingPanelMessage();
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
                ? `Đang soạn: ${skillSnapshot.name}`
                : "AI viết skill trực tiếp vào editor"}
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
                    AI đang viết skill…
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
        <SkillAgentPanelComposer
          value={input}
          onChange={setInput}
          onSend={() => void sendMessage(input)}
          sending={isTyping}
          disabled={inputDisabled}
          placeholder="Nhờ AI viết hoặc chỉnh skill…"
          providerId={providerId}
          providerOptions={providerSelectOptions}
          onProviderChange={handleProviderChange}
          modelId={modelId}
          modelOptions={modelSelectOptions}
          onModelChange={handleModelChange}
          modelsLoading={modelsLoading}
          hint="Mỗi lần gửi, AI thay nội dung editor và tự lưu. Xem lại trước khi bật skill."
        />
      </div>
    </Flex>
  );
}
