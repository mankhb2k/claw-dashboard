"use client";

import { ArrowUp, AlertTriangle, Paperclip, Square } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type DragEvent,
  type SetStateAction,
} from "react";

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
import { ContextUsageRing } from "./ContextUsageRing/ContextUsageRing";
import { InputMirror } from "./InputMirror/InputMirror";
import styles from "./MessageBox.module.css";
import { ModelSelects } from "./ModelSelects/ModelSelects";
import { flattenSlashMenuSections } from "./SlashMenu/slash-menu.utils";
import { SlashMenu } from "./SlashMenu/SlashMenu";
import { Box } from "@/components/layout";
import {
  deleteChatAttachment,
  uploadChatAttachment,
  chatAttachmentDownloadPath,
} from "@/lib/api/chat-attachments";
import { useI18n } from "@/lib/i18n";
import { translate } from "@/lib/i18n/translate";
import {
  isFileOverSandboxStagingLimit,
  sandboxStagingLimitError,
} from "@/utils/chat/sandbox-staging-limit";
import {
  buildSkillSlashCommand,
  filterSkillsBySlashQuery,
  parseLeadingSelectedSkill,
  parseSkillSlashState,
} from "@/utils/chat/skill-slash";


import type { ContextUsageSnapshot } from "./ContextUsageRing/context-usage.utils";
import type { SlashMenuSection } from "./SlashMenu/SlashMenu";
import type { InvokableSkill } from "@/utils/chat/skill-slash";

const MAX_INPUT_LINES = 12;

type SelectOption = {
  value: string;
  label: string;
};

type MessageBoxBaseProps = {
  value: string;
  onChange: (value: string) => void;
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
  inputId?: string;
  ariaLabel?: string;
  composerId?: string;
};

export type MessageBoxChatProps = MessageBoxBaseProps & {
  enableAttachments: true;
  onSend: (payload: ComposerSendPayload) => void;
  onAbort: () => void;
  canSend: boolean;
  modelSaving?: boolean;
  modelLabel?: string;
  contextUsage?: ContextUsageSnapshot;
  projectId?: string;
  sandboxActive?: boolean;
  stagingMaxBytes?: number;
  invokableSkills?: InvokableSkill[];
  invokableSkillsLoading?: boolean;
};

export type MessageBoxSimpleProps = MessageBoxBaseProps & {
  enableAttachments?: false;
  onSend: () => void;
};

export type MessageBoxProps = MessageBoxChatProps | MessageBoxSimpleProps;

function syncComposerHeight(
  el: HTMLTextAreaElement,
  maxLines: number,
): void {
  const element = el;
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
    const message = err instanceof Error ? err.message : translate("chat.composer.uploadFailed");
    setAttachments((prev) =>
      prev.map((item) =>
        item.id === localId
          ? { ...item, status: "error", error: message, progress: 0 }
          : item,
      ),
    );
  }
}

export function MessageBox(props: MessageBoxProps) {
  const { t } = useI18n();
  const {
    value,
    onChange,
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
  } = props;

  const enableAttachments = props.enableAttachments === true;
  const onAbort = enableAttachments ? props.onAbort : undefined;
  const canSend = enableAttachments ? props.canSend : undefined;
  const modelSaving = enableAttachments ? (props.modelSaving ?? false) : false;
  const modelLabel = enableAttachments ? props.modelLabel : undefined;
  const contextUsage = enableAttachments ? props.contextUsage : undefined;
  const projectId = enableAttachments ? props.projectId : undefined;
  const sandboxActive = enableAttachments ? (props.sandboxActive ?? false) : false;
  const stagingMaxBytes = enableAttachments ? props.stagingMaxBytes : undefined;
  const invokableSkills = enableAttachments ? props.invokableSkills : undefined;
  const invokableSkillsLoading = enableAttachments
    ? (props.invokableSkillsLoading ?? false)
    : false;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputMirrorRef = useRef<HTMLDivElement>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const attachmentsRef = useRef<ComposerAttachment[]>([]);

  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const [trackedSandboxActive, setTrackedSandboxActive] = useState(sandboxActive);

  if (sandboxActive !== trackedSandboxActive) {
    setTrackedSandboxActive(sandboxActive);
    setAttachments((prev) =>
      prev.map((item) => ({
        ...item,
        sandboxBlocked:
          sandboxActive &&
          isFileOverSandboxStagingLimit(item.file.size, true),
      })),
    );
  }
  const [attachmentErrors, setAttachmentErrors] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [skillMenuIndex, setSkillMenuIndex] = useState(0);

  const inputDisabled = disabled || sending;

  const slashState = useMemo(
    () => (enableAttachments ? parseSkillSlashState(value) : null),
    [enableAttachments, value],
  );
  const filteredInvokableSkills = useMemo(() => {
    if (!slashState || !invokableSkills) return [];
    return filterSkillsBySlashQuery(invokableSkills, slashState.query);
  }, [invokableSkills, slashState]);
  const skillMenuOpen =
    enableAttachments && Boolean(slashState) && !inputDisabled;
  const totalInvokableSkillCount = invokableSkills?.length ?? 0;
  const knownSkillSlugs = useMemo(
    () => invokableSkills?.map((skill) => skill.slug) ?? [],
    [invokableSkills],
  );
  const selectedSkillHighlight = useMemo(
    () =>
      enableAttachments
        ? parseLeadingSelectedSkill(value, knownSkillSlugs)
        : null,
    [enableAttachments, knownSkillSlugs, value],
  );

  const syncInputMirrorScroll = useCallback(() => {
    const textarea = textareaRef.current;
    const mirror = inputMirrorRef.current;
    if (!textarea || !mirror) return;
    mirror.scrollTop = textarea.scrollTop;
  }, []);

  const slashMenuSections = useMemo((): SlashMenuSection[] => {
    const emptyMessage = invokableSkillsLoading
      ? t("chat.composer.skillMenuLoading")
      : totalInvokableSkillCount === 0
        ? t("chat.composer.noSkillActive")
        : t("chat.composer.noMatchingSkills");

    return [
      {
        id: "skills",
        title: t("chat.composer.skillMenuTitle"),
        items: filteredInvokableSkills.map((skill) => ({
          id: skill.slug,
          label: `/${skill.slug}`,
          description: skill.description.trim() || skill.name,
        })),
        emptyMessage,
        loading: invokableSkillsLoading,
      },
    ];
  }, [
    filteredInvokableSkills,
    invokableSkillsLoading,
    t,
    totalInvokableSkillCount,
  ]);

  const slashMenuEntries = useMemo(
    () => flattenSlashMenuSections(slashMenuSections),
    [slashMenuSections],
  );

  const skillMenuResetKey = `${value}:${slashMenuEntries.length}`;
  const [skillMenuResetTracked, setSkillMenuResetTracked] =
    useState(skillMenuResetKey);
  if (skillMenuResetKey !== skillMenuResetTracked) {
    setSkillMenuResetTracked(skillMenuResetKey);
    setSkillMenuIndex(0);
  }

  const insertSkillCommand = useCallback(
    (skill: InvokableSkill) => {
      onChange(buildSkillSlashCommand(skill.slug));
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.focus();
        const end = buildSkillSlashCommand(skill.slug).length;
        el.setSelectionRange(end, end);
        syncComposerHeight(el, MAX_INPUT_LINES);
      });
    },
    [onChange],
  );

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

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
  const canSendNow = enableAttachments
    ? Boolean(canSend) &&
      !hasUploadingAttachments &&
      !hasSandboxOversized &&
      (value.trim().length > 0 || hasReadyAttachments)
    : (canSend ?? value.trim().length > 0) && !inputDisabled;

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
          errors.push(`Maximum ${MAX_ATTACHMENTS} files.`);
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
        setAttachmentErrors((prev) => [...prev, t("chat.composer.noProjectUpload")]);
      }
    },
    [inputDisabled, projectId, sandboxActive, t],
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
      const input = event.currentTarget;
      input.value = "";
    },
    [queueFiles],
  );

  const handleSendClick = useCallback(() => {
    if (!canSendNow) return;

    if (enableAttachments) {
      const readyAttachments = attachments.filter(
        (item) =>
          item.status === "ready" &&
          !item.sandboxBlocked &&
          item.serverId &&
          !isFileOverSandboxStagingLimit(item.file.size, sandboxActive),
      );
      (props as MessageBoxChatProps).onSend({
        text: value.trim(),
        attachments: readyAttachments,
      });
      onChange("");
      clearAttachments();
      setAttachmentErrors([]);
      return;
    }

    (props as MessageBoxSimpleProps).onSend();
  }, [
    attachments,
    canSendNow,
    clearAttachments,
    enableAttachments,
    onChange,
    props,
    sandboxActive,
    value,
  ]);

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

  return (
    <Box as="footer" className={styles.root} aria-label={ariaLabel}>
      <div
        className={`${styles.card} ${enableAttachments && dragOver ? styles.cardDragOver : ""}`}
        onDragEnter={enableAttachments ? handleDragEnter : undefined}
        onDragOver={enableAttachments ? handleDragOver : undefined}
        onDragLeave={enableAttachments ? handleDragLeave : undefined}
        onDrop={enableAttachments ? handleDrop : undefined}
      >
        {enableAttachments ? (
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
        ) : null}

        {enableAttachments ? (
          <AttachmentPreviewRow
            attachments={attachments}
            onRemove={removeAttachment}
            disabled={inputDisabled}
          />
        ) : null}

        {enableAttachments && sandboxActive ? (
          <div className={styles.sandboxCallout} role="status">
            <AlertTriangle size={14} aria-hidden />
            <span>
              {t("chat.composer.sandboxCallout", {
                mb: String(
                  Math.round((stagingMaxBytes ?? 5 * 1024 * 1024) / (1024 * 1024)),
                ),
              })}
            </span>
          </div>
        ) : null}

        {enableAttachments && attachmentErrors.length > 0 ? (
          <div className={styles.attachmentErrors} role="alert">
            {attachmentErrors.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        ) : null}

        <div className={styles.inputArea} ref={inputAreaRef}>
          <div
            role="combobox"
            aria-expanded={skillMenuOpen}
            aria-controls={skillMenuOpen ? "chat-slash-menu" : undefined}
            aria-haspopup="listbox"
          >
            <SlashMenu
              open={skillMenuOpen}
              anchorRef={inputAreaRef}
              sections={slashMenuSections}
              activeIndex={skillMenuIndex}
              id="chat-slash-menu"
              ariaLabel={t("chat.composer.skillMenuAria")}
              onSelect={(_sectionId, item) => {
                const skill = filteredInvokableSkills.find(
                  (entry) => entry.slug === item.id,
                );
                if (skill) insertSkillCommand(skill);
              }}
              onActiveChange={setSkillMenuIndex}
            />
            <div className={styles.composerInputShell}>
            {selectedSkillHighlight ? (
              <div
                ref={inputMirrorRef}
                className={styles.composerInputMirror}
                aria-hidden
              >
                <InputMirror value={value} knownSlugs={knownSkillSlugs} />
              </div>
            ) : null}
            <textarea
              ref={textareaRef}
              id={inputId}
              rows={1}
              spellCheck={false}
              className={`${styles.input} ${selectedSkillHighlight ? styles.inputWithSkillHighlight : ""}`}
              placeholder={placeholder}
              value={value}
              onChange={(event) => {
                onChange(event.target.value);
                syncComposerHeight(event.target, MAX_INPUT_LINES);
              }}
              onScroll={selectedSkillHighlight ? syncInputMirrorScroll : undefined}
            onPaste={enableAttachments ? handlePaste : undefined}
            onKeyDown={(event) => {
              if (skillMenuOpen) {
                if (event.key === "Escape") {
                  event.preventDefault();
                  onChange("");
                  return;
                }
              }
              if (skillMenuOpen && slashMenuEntries.length > 0) {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setSkillMenuIndex((index) =>
                    Math.min(index + 1, slashMenuEntries.length - 1),
                  );
                  return;
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setSkillMenuIndex((index) => Math.max(index - 1, 0));
                  return;
                }
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  const entry = slashMenuEntries[skillMenuIndex];
                  const skill = entry
                    ? filteredInvokableSkills.find(
                        (item) => item.slug === entry.item.id,
                      )
                    : undefined;
                  if (skill) insertSkillCommand(skill);
                  return;
                }
                if (event.key === "Tab") {
                  event.preventDefault();
                  const entry =
                    slashMenuEntries[skillMenuIndex] ?? slashMenuEntries[0];
                  const skill = entry
                    ? filteredInvokableSkills.find(
                        (item) => item.slug === entry.item.id,
                      )
                    : undefined;
                  if (skill) insertSkillCommand(skill);
                  return;
                }
              }
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (canSendNow) handleSendClick();
              }
            }}
            disabled={inputDisabled}
            aria-label={t("chat.composer.messageAria")}
            aria-autocomplete={skillMenuOpen ? "list" : undefined}
            />
            </div>
          </div>
        </div>

        <div className={styles.toolbar}>
          <ModelSelects
            composerId={composerId}
            providerId={providerId}
            providerOptions={providerOptions}
            onProviderChange={onProviderChange}
            modelId={modelId}
            modelOptions={modelOptions}
            onModelChange={onModelChange}
            modelsLoading={modelsLoading}
            selectsDisabled={selectsDisabled}
          />

          <div className={styles.toolbarRight}>
            {enableAttachments ? (
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => fileInputRef.current?.click()}
                disabled={inputDisabled}
                aria-label={t("chat.composer.attachAria")}
                title={t("chat.composer.attachTitle")}
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
                aria-label={t("chat.composer.stopAria")}
                title={t("chat.composer.stopTitle")}
              >
                <Square size={16} fill="currentColor" strokeWidth={0} />
              </button>
            ) : (
              <button
                type="button"
                className={`${styles.sendBtn} ${canSendNow ? styles.sendBtnActive : ""}`}
                onClick={handleSendClick}
                disabled={!canSendNow}
                aria-label={t("chat.composer.sendAria")}
                title={
                  hasSandboxOversized
                    ? t("chat.composer.sendBlockedSandbox")
                    : t("chat.composer.sendTitle")
                }
              >
                <ArrowUp size={16} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </div>
      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </Box>
  );
}

export type { ComposerAttachment, ComposerSendPayload };
