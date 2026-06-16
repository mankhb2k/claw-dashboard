"use client";

import { useCallback, useRef } from "react";
import { Box } from "@/components/layout";
import { useIsomorphicLayoutEffect } from "@/hooks/use-isomorphic-layout-effect";
import {
  COMPOSER_MAX_INPUT_LINES,
  syncComposerHeight,
} from "@/utils/chat/composer-height";
import { ComposerInput } from "./ComposerInput/ComposerInput";
import { ComposerToolbar } from "./ComposerToolbar/ComposerToolbar";
import type { MessageBoxSimpleProps } from "./message-box.types";
import { useComposerDraft } from "./use-composer-draft";
import styles from "./MessageBox.module.css";

export function MessageBoxSimple(props: MessageBoxSimpleProps) {
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
  } = props;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { value, onChange } = useComposerDraft(props);

  const inputDisabled = disabled || sending;
  const selectsDisabled =
    disabled ||
    sending ||
    modelsLoading ||
    providerOptions.length === 0;

  const canSendNow = value.trim().length > 0 && !inputDisabled;

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    syncComposerHeight(el, COMPOSER_MAX_INPUT_LINES);
  }, []);

  const handleTextareaChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(event.target.value);
    },
    [onChange],
  );

  const handleSendClick = useCallback(() => {
    if (!canSendNow) return;
    onSend();
  }, [canSendNow, onSend]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        if (canSendNow) handleSendClick();
      }
    },
    [canSendNow, handleSendClick],
  );

  useIsomorphicLayoutEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

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
      <div className={styles.card}>
        <ComposerInput
          inputId={inputId}
          placeholder={placeholder}
          textareaRef={textareaRef}
          displayValue={value}
          inputDisabled={inputDisabled}
          activeSkillChip={null}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
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
        />
      </div>
      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </Box>
  );
}
