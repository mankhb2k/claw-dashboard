"use client";

import { ArrowUp, Paperclip, Square } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type DragEvent,
  type SetStateAction,
} from "react";
import { Box } from "@/components/layout";
import { Select, Textarea } from "@/components/ui";
import { ContextUsageRing } from "./ContextUsageRing/ContextUsageRing";
import type { ContextUsageSnapshot } from "./ContextUsageRing/context-usage.utils";
import { AttachmentPreviewRow } from "./AttachmentPreviewRow/AttachmentPreviewRow";
import {
  FILE_INPUT_ACCEPT,
  MAX_ATTACHMENTS,
  type ComposerAttachment,
  type ComposerSendPayload,
  readClipboardImageFiles,
  revokeAttachmentPreview,
  validateFile,
} from "./AttachmentPreviewRow/composer-attachments";
import {
  insertTextAtSelection,
  readClipboardPlainText,
  restoreSelection,
} from "./AttachmentPreviewRow/composer-paste";
import styles from "./MessageBox.module.css";

const MAX_INPUT_LINES = 12;
const UPLOAD_TICK_MS = 45;

type SelectOption = {
  value: string;
  label: string;
};

export type MessageBoxProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: (payload: ComposerSendPayload) => void;
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

async function simulateAttachmentUpload(
  id: string,
  setAttachments: Dispatch<SetStateAction<ComposerAttachment[]>>,
): Promise<void> {
  for (let progress = 25; progress <= 100; progress += 25) {
    await new Promise((resolve) => window.setTimeout(resolve, UPLOAD_TICK_MS));
    setAttachments((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              progress,
              status: progress >= 100 ? "ready" : "uploading",
            }
          : item,
      ),
    );
  }
}

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
}: MessageBoxProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const attachmentsRef = useRef<ComposerAttachment[]>([]);

  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const [attachmentErrors, setAttachmentErrors] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);

  attachmentsRef.current = attachments;

  const inputDisabled = disabled || sending;
  const selectsDisabled =
    disabled ||
    sending ||
    modelsLoading ||
    modelSaving ||
    providerOptions.length === 0;

  const hasReadyAttachments = attachments.some(
    (item) => item.status === "ready",
  );
  const hasUploadingAttachments = attachments.some(
    (item) => item.status === "uploading",
  );
  const canSendNow =
    canSend &&
    !hasUploadingAttachments &&
    (value.trim().length > 0 || hasReadyAttachments);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    syncComposerHeight(el, MAX_INPUT_LINES);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) revokeAttachmentPreview(target);
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachments((prev) => {
      for (const item of prev) revokeAttachmentPreview(item);
      return [];
    });
  }, []);

  const queueFiles = useCallback(
    (files: File[]) => {
      if (!files.length || inputDisabled) return;

      const errors: string[] = [];
      const nextItems: ComposerAttachment[] = [];
      let slotCount = attachmentsRef.current.length;

      for (const file of files) {
        if (slotCount >= MAX_ATTACHMENTS) {
          errors.push(`Tối đa ${MAX_ATTACHMENTS} file.`);
          break;
        }

        const result = validateFile(file, slotCount);
        if (result.error) {
          errors.push(result.error);
          continue;
        }
        if (!result.attachment) continue;

        nextItems.push({
          ...result.attachment,
          id: crypto.randomUUID(),
        });
        slotCount += 1;
      }

      if (errors.length) {
        setAttachmentErrors(errors);
      }

      if (!nextItems.length) return;

      setAttachments((prev) => [...prev, ...nextItems]);
      for (const item of nextItems) {
        void simulateAttachmentUpload(item.id, setAttachments);
      }
    },
    [inputDisabled],
  );

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const imageFiles = readClipboardImageFiles(event.clipboardData);
      if (imageFiles.length) {
        event.preventDefault();
        setAttachmentErrors([]);
        queueFiles(imageFiles);
        return;
      }

      const textarea = event.currentTarget;
      const pasted = readClipboardPlainText(event.clipboardData);
      if (!pasted) return;

      event.preventDefault();
      const start = textarea.selectionStart ?? value.length;
      const nextValue = insertTextAtSelection(textarea, value, pasted);
      onChange(nextValue);

      const cursor = start + pasted.length;
      requestAnimationFrame(() => {
        restoreSelection(textarea, cursor, cursor);
        syncComposerHeight(textarea, MAX_INPUT_LINES);
      });
    },
    [onChange, queueFiles, value],
  );

  const handleDragEnter = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (inputDisabled) return;
      event.preventDefault();
      dragDepthRef.current += 1;
      setDragOver(true);
    },
    [inputDisabled],
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      dragDepthRef.current = 0;
      setDragOver(false);
      if (inputDisabled) return;
      setAttachmentErrors([]);
      queueFiles(Array.from(event.dataTransfer.files ?? []));
    },
    [inputDisabled, queueFiles],
  );

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setAttachmentErrors([]);
      queueFiles(Array.from(event.target.files ?? []));
      event.target.value = "";
    },
    [queueFiles],
  );

  const handleSendClick = useCallback(() => {
    if (!canSendNow) return;

    const readyAttachments = attachments.filter(
      (item) => item.status === "ready",
    );
    onSend({ text: value.trim(), attachments: readyAttachments });
    onChange("");
    clearAttachments();
    setAttachmentErrors([]);
  }, [attachments, canSendNow, clearAttachments, onChange, onSend, value]);

  useEffect(() => {
    adjustHeight();
  }, [value, attachments.length, adjustHeight]);

  useEffect(() => {
    return () => {
      for (const item of attachmentsRef.current) {
        revokeAttachmentPreview(item);
      }
    };
  }, []);

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
      <div
        className={`${styles.card} ${dragOver ? styles.cardDragOver : ""}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className={styles.hiddenFileInput}
          accept={FILE_INPUT_ACCEPT}
          multiple
          onChange={handleFileInputChange}
          disabled={inputDisabled}
          tabIndex={-1}
          aria-hidden
        />

        <AttachmentPreviewRow
          attachments={attachments}
          onRemove={removeAttachment}
          disabled={inputDisabled}
        />

        {attachmentErrors.length > 0 ? (
          <div className={styles.attachmentErrors} role="alert">
            {attachmentErrors.map((message, index) => (
              <p key={`${index}-${message}`}>{message}</p>
            ))}
          </div>
        ) : null}

        <div className={styles.inputArea}>
          <Textarea
            ref={textareaRef}
            id="chat-message-input"
            rows={1}
            className={styles.input}
            placeholder={placeholder}
            value={value}
            onChange={(event) => {
              onChange(event.target.value);
              syncComposerHeight(event.target, MAX_INPUT_LINES);
            }}
            onPaste={handlePaste}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (canSendNow) handleSendClick();
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
              onClick={() => fileInputRef.current?.click()}
              disabled={inputDisabled}
              aria-label="Đính kèm tài liệu hoặc hình ảnh"
              title="Đính kèm tài liệu hoặc hình ảnh"
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
                <Square size={16} fill="currentColor" strokeWidth={0} />
              </button>
            ) : (
              <button
                type="button"
                className={`${styles.sendBtn} ${canSendNow ? styles.sendBtnActive : ""}`}
                onClick={handleSendClick}
                disabled={!canSendNow}
                aria-label="Gửi tin nhắn"
                title="Gửi tin nhắn"
              >
                <ArrowUp size={16} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </div>
    </Box>
  );
}

export type { ComposerAttachment, ComposerSendPayload };
