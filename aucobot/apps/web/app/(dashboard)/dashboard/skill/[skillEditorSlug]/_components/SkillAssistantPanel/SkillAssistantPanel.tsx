"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button, Select, Spinner, Typography } from "@/components/ui";
import { projectApi } from "@/lib/api/project";
import type {
  SkillAssistantMessage,
  SkillAssistantOptionsResponse,
} from "@/schemas/project.schema";
import type { ProjectSkillDetail } from "@/schemas/project.schema";
import styles from "./SkillAssistantPanel.module.css";

type ChatRow = SkillAssistantMessage & { id: string };

interface SkillAssistantPanelProps {
  projectId: string;
  skill: ProjectSkillDetail;
  currentBodyMarkdown: string;
  onApplyMarkdown: (markdown: string) => void | Promise<void>;
}

export function SkillAssistantPanel({
  projectId,
  skill,
  currentBodyMarkdown,
  onApplyMarkdown,
}: SkillAssistantPanelProps) {
  const [options, setOptions] = useState<SkillAssistantOptionsResponse | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [providerId, setProviderId] = useState("");
  const [model, setModel] = useState("");
  const [messages, setMessages] = useState<ChatRow[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    setOptionsLoading(true);
    void projectApi
      .skillAssistantOptions(projectId)
      .then((res) => {
        setOptions(res);
        const first = res.providers[0];
        if (first) {
          setProviderId(first.providerId);
          const defaultModel =
            first.defaultModel ??
            first.models[0]?.openclawId ??
            "";
          setModel(defaultModel);
        }
      })
      .catch((err) => {
        setOptions({ providers: [] });
        setError(err instanceof Error ? err.message : "Không tải tùy chọn model");
      })
      .finally(() => setOptionsLoading(false));
  }, [projectId]);

  const activeProvider = useMemo(
    () => options?.providers.find((p) => p.providerId === providerId),
    [options, providerId],
  );

  const providerSelectOptions = useMemo(
    () =>
      (options?.providers ?? []).map((p) => ({
        value: p.providerId,
        label: p.displayName,
      })),
    [options],
  );

  const modelSelectOptions = useMemo(
    () =>
      (activeProvider?.models ?? []).map((m) => ({
        value: m.openclawId,
        label: m.name,
      })),
    [activeProvider],
  );

  const handleProviderChange = useCallback(
    (nextProviderId: string) => {
      setProviderId(nextProviderId);
      const p = options?.providers.find((x) => x.providerId === nextProviderId);
      if (p) {
        setModel(p.defaultModel ?? p.models[0]?.openclawId ?? "");
      }
    },
    [options],
  );

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !projectId || !providerId || !model || sending) return;

    const userMsg: ChatRow = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const res = await projectApi.skillAssistantComplete(projectId, {
        providerId,
        model,
        messages: nextMessages.map(({ role, content }) => ({ role, content })),
        skillContext: {
          slug: skill.slug,
          name: skill.name,
          description: skill.description,
          heading: skill.heading,
          currentBodyMarkdown,
        },
      });

      await onApplyMarkdown(res.markdown);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: "Đã cập nhật trực tiếp vào editor. Bạn có thể chỉnh tiếp ở khung bên trái.",
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI không phản hồi");
    } finally {
      setSending(false);
    }
  }, [
    input,
    projectId,
    providerId,
    model,
    sending,
    messages,
    skill,
    currentBodyMarkdown,
    onApplyMarkdown,
  ]);

  if (optionsLoading) {
    return (
      <div className={styles.panel}>
        <div className={styles.empty}>
          <Spinner size="sm" />
        </div>
      </div>
    );
  }

  if (!options?.providers.length) {
    return (
      <div className={styles.panel}>
        <div className={styles.header}>
          <p className={styles.title}>
            <Sparkles size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
            AI viết skill
          </p>
          <p className={styles.subtitle}>
            Cần API key Gemini hoặc OpenAI đã bật.
          </p>
        </div>
        <div className={styles.empty}>
          <Typography variant="p" color="muted">
            Chưa có provider sẵn sàng.{" "}
            <Link href="/dashboard/ai-model/gemini" className={styles.link}>
              Thêm key AI Model
            </Link>
          </Typography>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <p className={styles.title}>
          <Sparkles size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
          AI viết skill
        </p>
        <p className={styles.subtitle}>
          AI ghi thẳng vào editor (giống Cursor). Bạn chỉnh tiếp ở khung bên trái nếu cần.
        </p>
      </div>

      <div className={styles.controls}>
        <Select
          id="skill-ai-provider"
          label="Provider"
          value={providerId}
          onValueChange={handleProviderChange}
          options={providerSelectOptions}
          disabled={sending}
        />
        <Select
          id="skill-ai-model"
          label="Model"
          value={model}
          onValueChange={setModel}
          options={modelSelectOptions}
          disabled={sending || !modelSelectOptions.length}
          placeholder="Chọn model"
        />
      </div>

      <div className={styles.messages}>
        {messages.length === 0 ? (
          <div className={styles.empty}>
            Mô tả skill bạn muốn (ví dụ: &quot;Viết hướng dẫn agent tra cứu giá sản phẩm&quot;).
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={m.role === "user" ? styles.bubbleUser : styles.bubbleAssistant}
            >
              {m.content}
            </div>
          ))
        )}
        {sending ? (
          <Typography variant="small" color="muted">
            AI đang viết…
          </Typography>
        ) : null}
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.footer}>
        <textarea
          className={styles.textarea}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhờ AI viết hoặc chỉnh skill…"
          disabled={sending}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
        />
        <div className={styles.actions}>
          <Button
            size="sm"
            onClick={() => void handleSend()}
            disabled={sending || !input.trim()}
          >
            <Send size={14} style={{ marginRight: 6 }} />
            Gửi
          </Button>
        </div>
        <p className={styles.warning}>
          Mỗi lần gửi, AI thay nội dung editor và tự lưu. Xem lại trước khi bật skill.
        </p>
      </div>
    </div>
  );
}
