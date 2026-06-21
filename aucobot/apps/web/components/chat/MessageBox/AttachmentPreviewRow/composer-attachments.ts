import { translate } from '@/lib/i18n/translate'

export const MAX_ATTACHMENTS = 10;
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const MAX_DOC_BYTES = 20 * 1024 * 1024;

export type AttachmentKind = "image" | "document" | "pdf" | "other";
export type AttachmentStatus = "uploading" | "ready" | "error";

export type ComposerAttachment = {
  id: string;
  file: File;
  kind: AttachmentKind;
  previewUrl?: string;
  status: AttachmentStatus;
  progress: number;
  error?: string;
  serverId?: string;
  sandboxBlocked?: boolean;
};

export type ComposerSendPayload = {
  text: string;
  attachments: ComposerAttachment[];
};

const DOC_MIME_PREFIXES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument",
  "application/vnd.ms-",
  "application/rtf",
  "text/",
  "application/json",
  "application/xml",
  "application/zip",
  "application/x-zip-compressed",
];

const DOC_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".md",
  ".csv",
  ".json",
  ".xml",
  ".rtf",
  ".zip",
]);

function getExtension(name: string): string {
  const index = name.lastIndexOf(".");
  return index >= 0 ? name.slice(index).toLowerCase() : "";
}

export function classifyFile(file: File): AttachmentKind {
  if (file.type.startsWith("image/")) return "image";
  if (file.type === "application/pdf" || getExtension(file.name) === ".pdf") {
    return "pdf";
  }
  if (
    DOC_MIME_PREFIXES.some((prefix) => file.type.startsWith(prefix)) ||
    DOC_EXTENSIONS.has(getExtension(file.name))
  ) {
    return "document";
  }
  return "other";
}

export function getMaxBytesForKind(kind: AttachmentKind): number {
  return kind === "image" ? MAX_IMAGE_BYTES : MAX_DOC_BYTES;
}

export function isAllowedFile(file: File): boolean {
  const kind = classifyFile(file);
  if (kind === "other") {
    return file.size > 0;
  }
  return true;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${Math.round(bytes / (1024 * 1024))}MB`;
  }
  return `${Math.round(bytes / 1024)}KB`;
}

export function formatFileKindLabel(kind: AttachmentKind, file: File): string {
  if (kind === "image") return translate('chat.composer.kindLabels.image');
  if (kind === "pdf") return translate('chat.composer.kindLabels.pdf');
  if (kind === "document") {
    const ext = getExtension(file.name).replace(".", "").toUpperCase();
    return ext || translate('chat.composer.kindLabels.document');
  }
  const ext = getExtension(file.name).replace(".", "").toUpperCase();
  return ext || translate('chat.composer.kindLabels.file');
}

export function validateFile(
  file: File,
  existingCount: number,
): { attachment?: Omit<ComposerAttachment, "id">; error?: string } {
  if (existingCount >= MAX_ATTACHMENTS) {
    return { error: translate('chat.composer.maxFiles', { max: String(MAX_ATTACHMENTS) }) };
  }

  if (!isAllowedFile(file)) {
    return { error: translate('chat.composer.unsupportedFile', { name: file.name }) };
  }

  const kind = classifyFile(file);
  const maxBytes = getMaxBytesForKind(kind);
  if (file.size > maxBytes) {
    const limitLabel =
      kind === "image"
        ? translate('chat.composer.kindImage')
        : translate('chat.composer.kindDocument');
    return {
      error: translate('chat.composer.fileTooLarge', {
        name: file.name,
        limit: formatBytes(maxBytes),
        kind: limitLabel,
      }),
    };
  }

  const previewUrl = kind === "image" ? URL.createObjectURL(file) : undefined;
  return {
    attachment: {
      file,
      kind,
      previewUrl,
      status: "uploading",
      progress: 0,
    },
  };
}

export function createAttachmentFromFile(
  file: File,
): Omit<ComposerAttachment, "id"> {
  const kind = classifyFile(file);
  return {
    file,
    kind,
    previewUrl: kind === "image" ? URL.createObjectURL(file) : undefined,
    status: "uploading",
    progress: 0,
  };
}

export function revokeAttachmentPreview(attachment: ComposerAttachment): void {
  if (attachment.previewUrl) {
    URL.revokeObjectURL(attachment.previewUrl);
  }
}

export function readClipboardImageFiles(data: DataTransfer): File[] {
  const fromItems: File[] = [];
  if (data.items?.length) {
    for (const item of data.items) {
      if (item.kind !== "file") continue;
      const file = item.getAsFile();
      if (file?.type.startsWith("image/")) {
        fromItems.push(file);
      }
    }
  }

  if (fromItems.length) return fromItems;

  return Array.from(data.files ?? []).filter((file) =>
    file.type.startsWith("image/"),
  );
}

export const FILE_INPUT_ACCEPT =
  "image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.json,.xml,.rtf,.zip";
