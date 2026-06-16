"use client";

import { AlertTriangle } from "lucide-react";
import {
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Box } from "@/components/layout";
import { useIsomorphicLayoutEffect } from "@/hooks/use-isomorphic-layout-effect";
import {
  COMPOSER_MAX_INPUT_LINES,
  syncComposerHeight,
} from "@/utils/chat/composer-height";
import { AttachmentPreviewRow } from "./AttachmentPreviewRow/AttachmentPreviewRow";
import { FILE_INPUT_ACCEPT } from "./AttachmentPreviewRow/composer-attachments";
import {
  insertTextAtSelection,
  readClipboardPlainText,
  restoreSelection,
} from "./AttachmentPreviewRow/composer-paste";
import { ComposerInput } from "./ComposerInput/ComposerInput";
import { ComposerToolbar } from "./ComposerToolbar/ComposerToolbar";
import type { MessageBoxChatViewProps } from "./message-box.types";
import { useComposerAttachments } from "./use-composer-attachments";
import { useComposerDraft } from "./use-composer-draft";
import { useSlashComposer } from "./use-slash-composer";
import styles from "./MessageBox.module.css";

export function MessageBoxChat(props: MessageBoxChatViewProps) {
  const draftProps = { ...props, enableAttachments: true as const };
  const {
    sending,
    disabled = false,
    placeholder = "Type a message…",
    providerId,
    providerOptions,
    onProviderChange,
    modelId,
    modelOptions,
    onModelChange,
    modelsLoading = false,
    hint,
    inputId = "message-box-input",
    ariaLabel = "Message input",
    composerId = "message-box",
    onSend,
    onAbort,
    canSend,
    slashCommands: slashCommandsProp,
    modelSaving = false,
    modelLabel,
    contextUsage,
    projectId,
    sandboxActive = false,
    stagingMaxBytes,
  } = props;

  const slashCommands = useMemo(
    () => slashCommandsProp ?? [],
    [slashCommandsProp],
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { value, onChange, clearDraft, draftResetKey } = useComposerDraft(draftProps);

  const {
    slashOpen,
    filteredSlashCommands,
    slashActiveIndex,
    setSlashActiveIndex,
    activeSkillChip,
    updateSlashMenuFromValue,
    insertSlashCommand,
    handleComposerKeyDown,
  } = useSlashComposer({
    enabled: true,
    slashCommands,
    value,
    onChange,
    textareaRef,
    draftResetKey,
  });

  const inputDisabled = disabled || sending;
  const selectsDisabled =
    disabled ||
    sending ||
    modelsLoading ||
    modelSaving ||
    providerOptions.length === 0;

  const {
    attachments,
    attachmentCount,
    attachmentErrors,
    dragOver,
    fileInputRef,
    hasReadyAttachments,
    hasUploadingAttachments,
    hasSandboxOversized,
    removeAttachment,
    getReadyAttachmentsForSend,
    clearAfterSend,
    tryPasteImageFiles,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange,
    openFilePicker,
  } = useComposerAttachments({
    enabled: true,
    inputDisabled,
    projectId,
    sandboxActive,
  });

  const canSendNow =
    Boolean(canSend) &&
    !hasUploadingAttachments &&
    !hasSandboxOversized &&
    (value.trim().length > 0 || hasReadyAttachments);

  // Mirror latest value/canSend into refs so send handlers stay referentially
  // stable across keystrokes (lets ComposerToolbar skip re-renders while typing).
  const valueRef = useRef(value);
  valueRef.current = value;
  const canSendNowRef = useRef(canSendNow);
  canSendNowRef.current = canSendNow;

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    syncComposerHeight(el, COMPOSER_MAX_INPUT_LINES);
  }, []);

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      if (tryPasteImageFiles(event.clipboardData)) {
        event.preventDefault();
        return;
      }

      const textarea = event.currentTarget;
      const pasted = readClipboardPlainText(event.clipboardData);
      if (!pasted) return;

      event.preventDefault();
      const displayValue = activeSkillChip ? activeSkillChip.body : value;
      const start = textarea.selectionStart ?? displayValue.length;
      const nextBody = insertTextAtSelection(textarea, displayValue, pasted);
      const nextValue = activeSkillChip
        ? `${activeSkillChip.item.command} ${nextBody}`
        : nextBody;
      onChange(nextValue);

      const cursor = start + pasted.length;
      // Height is handled by the layout effect once the new value commits.
      requestAnimationFrame(() => {
        restoreSelection(textarea, cursor, cursor);
      });
    },
    [activeSkillChip, onChange, tryPasteImageFiles, value],
  );

  const handleTextareaChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const nextBody = event.target.value;
      const next = activeSkillChip
        ? `${activeSkillChip.item.command} ${nextBody}`
        : nextBody;
      onChange(next);
      updateSlashMenuFromValue(
        next,
        event.target.selectionStart ?? next.length,
      );
    },
    [activeSkillChip, onChange, updateSlashMenuFromValue],
  );

  const handleSendClick = useCallback(() => {
    if (!canSendNowRef.current) return;
    onSend({
      text: valueRef.current.trim(),
      attachments: getReadyAttachmentsForSend(),
    });
    clearDraft();
    clearAfterSend();
    // Empty value commit triggers the layout effect, which shrinks the textarea.
  }, [clearAfterSend, clearDraft, getReadyAttachmentsForSend, onSend]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (handleComposerKeyDown(event)) return;

      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        if (canSendNow) handleSendClick();
      }
    },
    [canSendNow, handleComposerKeyDown, handleSendClick],
  );

  // Single source of truth for textarea height. Runs synchronously after the
  // value/attachment DOM commit but before paint, so resizing never flickers.
  useIsomorphicLayoutEffect(() => {
    adjustHeight();
  }, [value, attachmentCount, adjustHeight]);

  const providerPlaceholder = modelsLoading
    ? "Loading…"
    : providerOptions.length === 0
      ? "No API key"
      : "Provider";

  const modelPlaceholder = modelsLoading
    ? "Loading…"
    : modelOptions.length === 0
      ? "Model"
      : "Model";

  return (
    <Box as="footer" className={styles.root} aria-label={ariaLabel}>
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
              Sandbox is enabled — attachments are limited to{" "}
              {Math.round((stagingMaxBytes ?? 5 * 1024 * 1024) / (1024 * 1024))}{" "}
              MB. Larger files cannot be sent.
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

        <ComposerInput
          inputId={inputId}
          placeholder={placeholder}
          textareaRef={textareaRef}
          displayValue={activeSkillChip ? activeSkillChip.body : value}
          inputDisabled={inputDisabled}
          activeSkillChip={activeSkillChip}
          onChange={handleTextareaChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          slashMenu={{
            open: slashOpen,
            items: filteredSlashCommands,
            activeIndex: slashActiveIndex,
            emptyMessage:
              slashCommands.length === 0
                ? "No skills available for this agent. Add skills in the Agent tab."
                : "No matching skills",
            onSelect: insertSlashCommand,
            onHighlight: setSlashActiveIndex,
          }}
        />

        <ComposerToolbar
          composerId={composerId}
          providerId={providerId}
          providerOptions={providerOptions}
          onProviderChange={onProviderChange}
          providerPlaceholder={providerPlaceholder}
          modelId={modelId}
          modelOptions={modelOptions}
          onModelChange={onModelChange}
          modelPlaceholder={modelPlaceholder}
          selectsDisabled={selectsDisabled}
          sending={sending}
          canSendNow={canSendNow}
          onSend={handleSendClick}
          sendTitle={
            hasSandboxOversized
              ? "A file exceeds 5 MB (sandbox)"
              : "Send message"
          }
          onAttachClick={openFilePicker}
          inputDisabled={inputDisabled}
          contextUsage={contextUsage}
          modelLabel={modelLabel ?? modelId}
          onAbort={onAbort}
        />
      </div>
      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </Box>
  );
}
