"use client";

import { ArrowUp, Paperclip, Square } from "lucide-react";
import { Box } from "@/components/layout";
import { Select, Textarea } from "@/components/ui";
import { ContextUsageRing } from "../ContextUsageRing/ContextUsageRing";
import type { ContextUsageSnapshot } from "../ContextUsageRing/context-usage.utils";
import styles from "./MessageBox.module.css";

type SelectOption = {
  value: string;
  label: string;
};

export type MessageBoxProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onAbort: () => void;
  sending: boolean;
  canSend: boolean;
  disabled?: boolean;
  placeholder?: string;
  providerId?: string;
  providerOptions: SelectOption[];
  onProviderChange: (providerId: string) => void;
  modelId?: string;
  modelOptions: SelectOption[];
  onModelChange: (model: string) => void;
  modelsLoading?: boolean;
  modelSaving?: boolean;
  modelLabel?: string;
  contextUsage?: ContextUsageSnapshot;
  onAttach?: () => void;
  attachDisabled?: boolean;
};

export function MessageBox({
  value,
  onChange,
  onSend,
  onAbort,
  sending,
  canSend,
  disabled = false,
  placeholder = "Nhập tin nhắn…",
  providerId,
  providerOptions,
  onProviderChange,
  modelId,
  modelOptions,
  onModelChange,
  modelsLoading = false,
  modelSaving = false,
  modelLabel,
  contextUsage,
  onAttach,
  attachDisabled = true,
}: MessageBoxProps) {
  const inputDisabled = disabled || sending;
  const selectsDisabled =
    disabled ||
    sending ||
    modelsLoading ||
    modelSaving ||
    providerOptions.length === 0;

  const providerPlaceholder = modelsLoading
    ? "Đang tải…"
    : providerOptions.length === 0
      ? "Chưa có API key"
      : "Provider";

  const modelPlaceholder = modelsLoading
    ? "Đang tải…"
    : modelOptions.length === 0
      ? "Model"
      : "Model";

  return (
    <Box as="footer" className={styles.root} aria-label="Chat message input">
      <div className={styles.card}>
        <div className={styles.inputArea}>
          <Textarea
            id="chat-message-input"
            rows={1}
            className={styles.input}
            placeholder={placeholder}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (canSend) onSend();
              }
            }}
            disabled={inputDisabled}
            aria-label="Message"
          />
        </div>

        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <div className={styles.toolbarSelect}>
              <Select
                id="chat-composer-provider"
                labelPosition="none"
                value={providerId || undefined}
                onValueChange={onProviderChange}
                options={providerOptions}
                disabled={selectsDisabled}
                placeholder={providerPlaceholder}
              />
            </div>
            <div className={styles.toolbarSelect}>
              <Select
                id="chat-composer-model"
                labelPosition="none"
                value={modelId || undefined}
                onValueChange={onModelChange}
                options={modelOptions}
                disabled={
                  selectsDisabled || modelOptions.length === 0 || !providerId
                }
                placeholder={modelPlaceholder}
              />
            </div>
          </div>

          <div className={styles.toolbarRight}>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={onAttach}
              disabled={attachDisabled || disabled}
              aria-label="Đính kèm tài liệu hoặc hình ảnh"
              title={
                attachDisabled
                  ? "Đính kèm — sắp có"
                  : "Đính kèm tài liệu hoặc hình ảnh"
              }
            >
              <Paperclip size={16} strokeWidth={1.75} />
            </button>

            <ContextUsageRing
              {...contextUsage}
              modelLabel={modelLabel ?? modelId}
            />

            {sending ? (
              <button
                type="button"
                className={`${styles.sendBtn} ${styles.sendBtnStop}`}
                onClick={onAbort}
                aria-label="Dừng phản hồi"
                title="Dừng phản hồi"
              >
                <Square size={14} fill="currentColor" strokeWidth={0} />
              </button>
            ) : (
              <button
                type="button"
                className={`${styles.sendBtn} ${canSend ? styles.sendBtnActive : ""}`}
                onClick={onSend}
                disabled={!canSend}
                aria-label="Gửi tin nhắn"
                title="Gửi tin nhắn"
              >
                <ArrowUp size={18} strokeWidth={2.25} />
              </button>
            )}
          </div>
        </div>
      </div>

      <p className={styles.hint}>Enter gửi · Shift+Enter xuống dòng</p>
    </Box>
  );
}
