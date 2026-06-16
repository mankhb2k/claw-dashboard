"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type RefObject,
} from "react";
import { deleteChatAttachment } from "@/lib/api/chat-attachments";
import {
  isFileOverSandboxStagingLimit,
  sandboxStagingLimitError,
} from "@/utils/chat/sandbox-staging-limit";
import {
  MAX_ATTACHMENTS,
  readClipboardImageFiles,
  revokeAttachmentPreview,
  validateFile,
  type ComposerAttachment,
} from "./AttachmentPreviewRow/composer-attachments";
import { uploadComposerAttachment } from "./AttachmentPreviewRow/composer-upload";

export type UseComposerAttachmentsParams = {
  enabled: boolean;
  inputDisabled: boolean;
  projectId?: string;
  sandboxActive?: boolean;
};

export type UseComposerAttachmentsResult = {
  attachments: ComposerAttachment[];
  attachmentCount: number;
  attachmentErrors: string[];
  dragOver: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  hasReadyAttachments: boolean;
  hasUploadingAttachments: boolean;
  hasSandboxOversized: boolean;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
  getReadyAttachmentsForSend: () => ComposerAttachment[];
  clearAfterSend: () => void;
  queueFiles: (files: File[]) => void;
  /** Returns true when clipboard held image(s) and they were queued. */
  tryPasteImageFiles: (clipboardData: DataTransfer) => boolean;
  handleDragEnter: (event: DragEvent<HTMLDivElement>) => void;
  handleDragOver: (event: DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  handleDrop: (event: DragEvent<HTMLDivElement>) => void;
  handleFileInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  openFilePicker: () => void;
};

const noop = () => undefined;

export function useComposerAttachments({
  enabled,
  inputDisabled,
  projectId,
  sandboxActive = false,
}: UseComposerAttachmentsParams): UseComposerAttachmentsResult {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const attachmentsRef = useRef<ComposerAttachment[]>([]);

  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const [attachmentErrors, setAttachmentErrors] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);

  attachmentsRef.current = attachments;

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

  const removeAttachment = useCallback(
    (id: string) => {
      if (!enabled) return;
      setAttachments((prev) => {
        const target = prev.find((item) => item.id === id);
        if (target) {
          revokeAttachmentPreview(target);
          if (projectId && target.serverId) {
            void deleteChatAttachment(projectId, target.serverId).catch(
              () => undefined,
            );
          }
        }
        return prev.filter((item) => item.id !== id);
      });
    },
    [enabled, projectId],
  );

  const clearAttachments = useCallback(() => {
    if (!enabled) return;
    setAttachments((prev) => {
      for (const item of prev) revokeAttachmentPreview(item);
      return [];
    });
  }, [enabled]);

  const getReadyAttachmentsForSend = useCallback((): ComposerAttachment[] => {
    if (!enabled) return [];
    return attachments.filter(
      (item) =>
        item.status === "ready" &&
        !item.sandboxBlocked &&
        item.serverId &&
        !isFileOverSandboxStagingLimit(item.file.size, sandboxActive),
    );
  }, [attachments, enabled, sandboxActive]);

  const clearAfterSend = useCallback(() => {
    if (!enabled) return;
    clearAttachments();
    setAttachmentErrors([]);
  }, [clearAttachments, enabled]);

  const queueFiles = useCallback(
    (files: File[]) => {
      if (!enabled || !files.length || inputDisabled) return;

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
          void uploadComposerAttachment(
            projectId,
            item.id,
            item.file,
            setAttachments,
          );
        }
      } else {
        setAttachmentErrors((prev) => [
          ...prev,
          "No project selected for file upload.",
        ]);
      }
    },
    [enabled, inputDisabled, projectId, sandboxActive],
  );

  const tryPasteImageFiles = useCallback(
    (clipboardData: DataTransfer): boolean => {
      if (!enabled) return false;
      const imageFiles = readClipboardImageFiles(clipboardData);
      if (!imageFiles.length) return false;
      setAttachmentErrors([]);
      queueFiles(imageFiles);
      return true;
    },
    [enabled, queueFiles],
  );

  const handleDragEnter = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!enabled || inputDisabled) return;
      event.preventDefault();
      dragDepthRef.current += 1;
      setDragOver(true);
    },
    [enabled, inputDisabled],
  );

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!enabled) return;
      event.preventDefault();
    },
    [enabled],
  );

  const handleDragLeave = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!enabled) return;
      event.preventDefault();
      dragDepthRef.current -= 1;
      if (dragDepthRef.current <= 0) {
        dragDepthRef.current = 0;
        setDragOver(false);
      }
    },
    [enabled],
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!enabled) return;
      event.preventDefault();
      dragDepthRef.current = 0;
      setDragOver(false);
      if (inputDisabled) return;
      setAttachmentErrors([]);
      queueFiles(Array.from(event.dataTransfer.files ?? []));
    },
    [enabled, inputDisabled, queueFiles],
  );

  const handleFileInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (!enabled) return;
      setAttachmentErrors([]);
      queueFiles(Array.from(event.target.files ?? []));
      event.target.value = "";
    },
    [enabled, queueFiles],
  );

  const openFilePicker = useCallback(() => {
    if (!enabled) return;
    fileInputRef.current?.click();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
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
  }, [enabled, sandboxActive]);

  useEffect(() => {
    if (!enabled) return;
    return () => {
      for (const item of attachmentsRef.current) {
        revokeAttachmentPreview(item);
      }
    };
  }, [enabled]);

  if (!enabled) {
    return {
      attachments: [],
      attachmentCount: 0,
      attachmentErrors: [],
      dragOver: false,
      fileInputRef,
      hasReadyAttachments: false,
      hasUploadingAttachments: false,
      hasSandboxOversized: false,
      removeAttachment: noop,
      clearAttachments: noop,
      getReadyAttachmentsForSend: () => [],
      clearAfterSend: noop,
      queueFiles: noop,
      tryPasteImageFiles: () => false,
      handleDragEnter: noop,
      handleDragOver: noop,
      handleDragLeave: noop,
      handleDrop: noop,
      handleFileInputChange: noop,
      openFilePicker: noop,
    };
  }

  return {
    attachments,
    attachmentCount: attachments.length,
    attachmentErrors,
    dragOver,
    fileInputRef,
    hasReadyAttachments,
    hasUploadingAttachments,
    hasSandboxOversized,
    removeAttachment,
    clearAttachments,
    getReadyAttachmentsForSend,
    clearAfterSend,
    queueFiles,
    tryPasteImageFiles,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange,
    openFilePicker,
  };
}
