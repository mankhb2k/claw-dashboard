"use client";

import { ArrowUp, AlertTriangle, Paperclip, Square } from "lucide-react";
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
import {
  deleteChatAttachment,
  uploadChatAttachment,
  chatAttachmentDownloadPath,
} from "@/lib/api/chat-attachments";
import {
  isFileOverSandboxStagingLimit,
  sandboxStagingLimitError,
} from "@/lib/chat/sandbox-staging-limit";
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
  projectId?: string;
  sandboxActive?: boolean;
  stagingMaxBytes?: number;
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

async function uploadComposerAttachment(
  projectId: string,
  localId: string,
  file: File,
  setAttachments: Dispatch<SetStateAction<ComposerAttachment[]>>,
): Promise<void> {
  try {
    setAttachments((prev) =>
      prev.map((item) =>
        item.id === localId ? { ...item, progress: 40, status: "uploading" } : item,
      ),
    );
    const result = await uploadChatAttachment(projectId, file);
    const previewUrl =
      result.kind === "image"
        ? chatAttachmentDownloadPath(projectId, result.id)
        : undefined;
    setAttachments((prev) =>
      prev.map((item) =>
        item.id === localId
          ? {
              ...item,
              serverId: result.id,
              progress: 100,
              status: "ready",
              previewUrl: previewUrl ?? item.previewUrl,
            }
          : item,
      ),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    setAttachments((prev) =>
      prev.map((item) =>
        item.id === localId
          ? { ...item, status: "error", error: message, progress: 0 }
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
  projectId,
  sandboxActive = false,
  stagingMaxBytes,
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
    (item) => item.status === "ready" && !item.sandboxBlocked,
  );
  const hasUploadingAttachments = attachments.some(
    (item) => item.status === "uploading",
  );
  const hasSandboxOversized = attachments.some(
    (item) =>
      item.status === "ready" &&
      (item.sandboxBlocked ||
        isFileOverSandboxStagingLimit(item.file.size, sandboxActive)),
  );
  const canSendNow =
    canSend &&
    !hasUploadingAttachments &&
    !hasSandboxOversized &&
    (value.trim().length > 0 || hasReadyAttachments);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    syncComposerHeight(el, MAX_INPUT_LINES);
  }, []);

  const removeAttachment = useCallback(
    (id: string) => {
      setAttachments((prev) => {
        const target = prev.find((item) => item.id === id);
        if (target) {
          revokeAttachmentPreview(target);
          if (projectId && target.serverId) {
            void deleteChatAttachment(projectId, target.serverId).catch(() => undefined);
          }
        }
        return prev.filter((item) => item.id !== id);
      });
    },
    [projectId],
  );

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

        if (sandboxActive && isFileOverSandboxStagingLimit(file.size, true)) {
          errors.push(sandboxStagingLimitError(file.name));
          continue;
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
      if (projectId) {
        for (const item of nextItems) {
          void uploadComposerAttachment(projectId, item.id, item.file, setAttachments);
        }
      } else {
        setAttachmentErrors((prev) => [...prev, "Chưa chọn dự án để upload file."]);
      }
    },
    [inputDisabled, projectId, sandboxActive],
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
      (item) =>
        item.status === "ready" &&
        !item.sandboxBlocked &&
        item.serverId &&
        !isFileOverSandboxStagingLimit(item.file.size, sandboxActive),
    );
    onSend({ text: value.trim(), attachments: readyAttachments });
    onChange("");
    clearAttachments();
    setAttachmentErrors([]);
  }, [attachments, canSendNow, clearAttachments, onChange, onSend, sandboxActive, value]);

  useEffect(() => {
    if (!sandboxActive) {
      setAttachments((prev) =>
        prev.map((item) => ({ ...item, sandboxBlocked: false })),
      );
      return;
    }
    setAttachments((prev) =>
      prev.map((item) => ({
        ...item,
        sandboxBlocked: isFileOverSandboxStagingLimit(item.file.size, true),
      })),
    );
  }, [sandboxActive]);

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

        {sandboxActive ? (
          <div className={styles.sandboxCallout} role="status">
            <AlertTriangle size={14} aria-hidden />
            <span>
              Sandbox đang bật — file đính kèm tối đa{" "}
              {Math.round((stagingMaxBytes ?? 5 * 1024 * 1024) / (1024 * 1024))} MB.
              File lớn hơn sẽ không gửi được.
            </span>
          </div>
        ) : null}

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
                title={
                  hasSandboxOversized
                    ? "Có file vượt 5 MB (sandbox)"
                    : "Gửi tin nhắn"
                }
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
