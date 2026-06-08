"use client";

import { ArrowUp } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { Box } from "@/components/layout";
import { Select, Textarea } from "@/components/ui";
import messageBoxStyles from "@/app/(dashboard)/dashboard/chat/_components/MessageBox/MessageBox.module.css";

const MAX_INPUT_LINES = 12;

type SelectOption = {
  value: string;
  label: string;
};

export type SkillAgentPanelComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  sending: boolean;
  disabled?: boolean;
  placeholder?: string;
  providerId?: string;
  providerOptions: SelectOption[];
  onProviderChange: (providerId: string) => void;
  modelId?: string;
  modelOptions: SelectOption[];
  onModelChange: (model: string) => void;
  modelsLoading?: boolean;
  hint?: string;
};

function syncComposerHeight(
  element: HTMLTextAreaElement,
  maxLines: number,
): void {
  element.style.height = "auto";
  const styles = getComputedStyle(element);
  const lineHeight = Number.parseFloat(styles.lineHeight) || 20;
  const paddingTop = Number.parseFloat(styles.paddingTop) || 0;
  const paddingBottom = Number.parseFloat(styles.paddingBottom) || 0;
  const maxHeight = lineHeight * maxLines + paddingTop + paddingBottom;
  const nextHeight = Math.min(element.scrollHeight, maxHeight);
  element.style.height = `${nextHeight}px`;
  element.style.overflowY =
    element.scrollHeight > maxHeight ? "auto" : "hidden";
}

export function SkillAgentPanelComposer({
  value,
  onChange,
  onSend,
  sending,
  disabled = false,
  placeholder = "Nhờ AI viết hoặc chỉnh skill…",
  providerId,
  providerOptions,
  onProviderChange,
  modelId,
  modelOptions,
  onModelChange,
  modelsLoading = false,
  hint,
}: SkillAgentPanelComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputDisabled = disabled || sending;
  const canSend = value.trim().length > 0 && !inputDisabled;

  const adjustHeight = useCallback(() => {
    const element = textareaRef.current;
    if (element) syncComposerHeight(element, MAX_INPUT_LINES);
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleSendClick = useCallback(() => {
    if (!canSend) return;
    onSend();
  }, [canSend, onSend]);

  const selectsDisabled = inputDisabled || modelsLoading;
  const providerPlaceholder = modelsLoading
    ? "Đang tải…"
    : providerOptions.length === 0
      ? "Chưa có API key"
      : "Provider";
  const modelPlaceholder = modelsLoading ? "Đang tải…" : "Model";

  return (
    <Box
      as="footer"
      className={messageBoxStyles.root}
      aria-label="Skill assistant message input"
    >
      <div className={messageBoxStyles.card}>
        <div className={messageBoxStyles.inputArea}>
          <Textarea
            ref={textareaRef}
            id="skill-panel-message-input"
            rows={1}
            className={messageBoxStyles.input}
            placeholder={placeholder}
            value={value}
            onChange={(event) => {
              onChange(event.target.value);
              syncComposerHeight(event.target, MAX_INPUT_LINES);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (canSend) handleSendClick();
              }
            }}
            disabled={inputDisabled}
            aria-label="Message"
          />
        </div>

        <div className={messageBoxStyles.toolbar}>
          <div className={messageBoxStyles.toolbarLeft}>
            <div className={messageBoxStyles.toolbarSelect}>
              <Select
                id="skill-panel-composer-provider"
                labelPosition="none"
                value={providerId || undefined}
                onValueChange={onProviderChange}
                options={providerOptions}
                disabled={selectsDisabled || providerOptions.length === 0}
                placeholder={providerPlaceholder}
              />
            </div>
            <div className={messageBoxStyles.toolbarSelect}>
              <Select
                id="skill-panel-composer-model"
                labelPosition="none"
                value={modelId || undefined}
                onValueChange={onModelChange}
                options={modelOptions}
                disabled={
                  selectsDisabled ||
                  modelOptions.length === 0 ||
                  !providerId
                }
                placeholder={modelPlaceholder}
              />
            </div>
          </div>

          <div className={messageBoxStyles.toolbarRight}>
            <button
              type="button"
              className={`${messageBoxStyles.sendBtn} ${canSend ? messageBoxStyles.sendBtnActive : ""}`}
              onClick={handleSendClick}
              disabled={!canSend}
              aria-label="Gửi tin nhắn"
              title="Gửi tin nhắn"
            >
              <ArrowUp size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
      {hint ? <p className={messageBoxStyles.hint}>{hint}</p> : null}
    </Box>
  );
}
