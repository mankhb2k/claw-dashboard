"use client";

import { FileText, X } from "lucide-react";
import type { ComposerAttachment } from "./composer-attachments";
import { formatFileKindLabel } from "./composer-attachments";
import styles from "./AttachmentPreviewRow.module.css";

type AttachmentPreviewRowProps = {
  attachments: ComposerAttachment[];
  onRemove: (id: string) => void;
  disabled?: boolean;
};

function UploadProgressRing({ progress }: { progress: number }) {
  const size = 28;
  const stroke = 2.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg
      className={styles.progressRing}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden
    >
      <circle
        className={styles.progressTrack}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
      />
      <circle
        className={styles.progressFill}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

function ImageAttachmentChip({
  attachment,
  onRemove,
  disabled,
}: {
  attachment: ComposerAttachment;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const uploading = attachment.status === "uploading";
  const blocked = attachment.sandboxBlocked || attachment.status === "error";

  return (
    <div className={`${styles.imageChip} ${blocked ? styles.chipBlocked : ""}`}>
      {attachment.previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={attachment.previewUrl}
          alt={attachment.file.name}
          className={styles.imageThumb}
        />
      ) : null}
      {uploading ? (
        <div className={styles.imageOverlay}>
          <UploadProgressRing progress={attachment.progress} />
        </div>
      ) : null}
      <button
        type="button"
        className={styles.removeBtn}
        onClick={onRemove}
        disabled={disabled || uploading}
        aria-label={`Remove ${attachment.file.name}`}
        title="Remove file"
      >
        <X size={12} strokeWidth={2.5} />
      </button>
    </div>
  );
}

function FileAttachmentChip({
  attachment,
  onRemove,
  disabled,
}: {
  attachment: ComposerAttachment;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const uploading = attachment.status === "uploading";
  const blocked = attachment.sandboxBlocked || attachment.status === "error";
  const kindClass =
    attachment.kind === "pdf"
      ? styles.fileIconPdf
      : attachment.kind === "document"
        ? styles.fileIconDoc
        : styles.fileIconOther;

  return (
    <div className={`${styles.fileChip} ${blocked ? styles.chipBlocked : ""}`}>
      <div className={`${styles.fileIcon} ${kindClass}`}>
        {uploading ? (
          <UploadProgressRing progress={attachment.progress} />
        ) : (
          <FileText size={16} strokeWidth={1.75} />
        )}
      </div>
      <div className={styles.fileMeta}>
        <span className={styles.fileName} title={attachment.file.name}>
          {attachment.file.name}
        </span>
        <span className={styles.fileKind}>
          {attachment.sandboxBlocked
            ? "Over 5 MB (sandbox)"
            : attachment.error
              ? attachment.error
              : formatFileKindLabel(attachment.kind, attachment.file)}
        </span>
      </div>
      <button
        type="button"
        className={styles.fileRemoveBtn}
        onClick={onRemove}
        disabled={disabled || uploading}
        aria-label={`Remove ${attachment.file.name}`}
        title="Remove file"
      >
        <X size={14} strokeWidth={2} />
      </button>
    </div>
  );
}

export function AttachmentPreviewRow({
  attachments,
  onRemove,
  disabled,
}: AttachmentPreviewRowProps) {
  if (!attachments.length) return null;

  return (
    <div className={styles.row} aria-label="Attached files">
      {attachments.map((attachment) =>
        attachment.kind === "image" ? (
          <ImageAttachmentChip
            key={attachment.id}
            attachment={attachment}
            onRemove={() => onRemove(attachment.id)}
            disabled={disabled}
          />
        ) : (
          <FileAttachmentChip
            key={attachment.id}
            attachment={attachment}
            onRemove={() => onRemove(attachment.id)}
            disabled={disabled}
          />
        ),
      )}
    </div>
  );
}
