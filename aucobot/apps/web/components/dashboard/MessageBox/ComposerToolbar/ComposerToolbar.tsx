"use client";

import { memo } from "react";
import { ArrowUp, Paperclip, Square } from "lucide-react";
import type { ContextUsageSnapshot } from "../ContextUsageRing/context-usage.utils";
import { ContextUsageRing } from "../ContextUsageRing/ContextUsageRing";
import type { MessageBoxSelectOption } from "../message-box.types";
import { SelectModelAI } from "../SelectModelAI/SelectModelAI";
import styles from "../MessageBox.module.css";

export type ComposerToolbarProps = {
  composerId: string;
  providerId?: string;
  providerOptions: MessageBoxSelectOption[];
  onProviderChange: (providerId: string) => void;
  providerPlaceholder: string;
  modelId?: string;
  modelOptions: MessageBoxSelectOption[];
  onModelChange: (model: string) => void;
  modelPlaceholder: string;
  selectsDisabled: boolean;
  sending: boolean;
  canSendNow: boolean;
  onSend: () => void;
  sendTitle?: string;
  onAttachClick?: () => void;
  inputDisabled?: boolean;
  contextUsage?: ContextUsageSnapshot;
  modelLabel?: string;
  onAbort?: () => void;
};

export const ComposerToolbar = memo(function ComposerToolbar({
  composerId,
  providerId,
  providerOptions,
  onProviderChange,
  providerPlaceholder,
  modelId,
  modelOptions,
  onModelChange,
  modelPlaceholder,
  selectsDisabled,
  sending,
  canSendNow,
  onSend,
  sendTitle = "Send message",
  onAttachClick,
  inputDisabled = false,
  contextUsage,
  modelLabel,
  onAbort,
}: ComposerToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarLeft}>
        <div className={styles.toolbarSelect}>
          <SelectModelAI
            id={`${composerId}-provider`}
            value={providerId}
            onValueChange={onProviderChange}
            options={providerOptions}
            disabled={selectsDisabled}
            placeholder={providerPlaceholder}
            ariaLabel="Select AI provider"
          />
        </div>
        <div className={styles.toolbarSelect}>
          <SelectModelAI
            id={`${composerId}-model`}
            value={modelId}
            onValueChange={onModelChange}
            options={modelOptions}
            disabled={
              selectsDisabled || modelOptions.length === 0 || !providerId
            }
            placeholder={modelPlaceholder}
            ariaLabel="Select AI model"
          />
        </div>
      </div>

      <div className={styles.toolbarRight}>
        {onAttachClick ? (
          <button
            type="button"
            className={styles.iconBtn}
            onClick={onAttachClick}
            disabled={inputDisabled}
            aria-label="Attach a document or image"
            title="Attach a document or image"
          >
            <Paperclip size={16} strokeWidth={1.75} />
          </button>
        ) : null}

        {contextUsage ? (
          <ContextUsageRing
            {...contextUsage}
            modelLabel={modelLabel ?? modelId}
          />
        ) : null}

        {sending && onAbort ? (
          <button
            type="button"
            className={`${styles.sendBtn} ${styles.sendBtnStop}`}
            onClick={onAbort}
            aria-label="Stop response"
            title="Stop response"
          >
            <Square size={16} fill="currentColor" strokeWidth={0} />
          </button>
        ) : (
          <button
            type="button"
            className={`${styles.sendBtn} ${canSendNow ? styles.sendBtnActive : ""}`}
            onClick={onSend}
            disabled={!canSendNow}
            aria-label="Send message"
            title={sendTitle}
          >
            <ArrowUp size={16} strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
});
