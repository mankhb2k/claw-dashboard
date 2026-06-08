/** Gateway sandbox staging cap (openclaw-worker prestageMediaPathOffloads). */
export const SANDBOX_STAGING_MAX_BYTES = 5 * 1024 * 1024;

export const CHAT_ATTACHMENT_MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const CHAT_ATTACHMENT_MAX_DOC_BYTES = 20 * 1024 * 1024;
export const CHAT_ATTACHMENT_MAX_COUNT = 10;

export type ChatAttachmentKind = 'image' | 'document';

export type ChatAttachmentStorageRef = {
  storagePath?: string | null;
  storageKey?: string | null;
};

export type ChatAttachmentSaveInput = {
  projectId: string;
  kind: ChatAttachmentKind;
  buffer: Buffer;
  mimeType: string;
  attachmentId: string;
};

export type ChatAttachmentSaveResult = {
  storagePath?: string;
  storageKey?: string;
  sizeBytes: number;
};

export type ChatAttachmentReadResult = {
  buffer: Buffer;
  mimeType: string;
};

export interface ChatAttachmentStorage {
  save(input: ChatAttachmentSaveInput): Promise<ChatAttachmentSaveResult>;
  read(projectId: string, ref: ChatAttachmentStorageRef): Promise<ChatAttachmentReadResult>;
  delete(projectId: string, ref: ChatAttachmentStorageRef): Promise<void>;
}

const IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const DOC_MIME_PREFIXES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument',
  'application/vnd.ms-',
  'application/rtf',
  'text/',
  'application/json',
  'application/xml',
  'application/zip',
  'application/x-zip-compressed',
];

export function classifyChatAttachmentKind(
  mimeType: string,
  originalName?: string,
): ChatAttachmentKind | null {
  if (IMAGE_MIMES.has(mimeType) || mimeType.startsWith('image/')) {
    return 'image';
  }
  const lower = (originalName ?? '').toLowerCase();
  if (
    mimeType === 'application/pdf' ||
    lower.endsWith('.pdf') ||
    DOC_MIME_PREFIXES.some((p) => mimeType.startsWith(p))
  ) {
    return 'document';
  }
  return null;
}

export function maxBytesForChatKind(kind: ChatAttachmentKind): number {
  return kind === 'image'
    ? CHAT_ATTACHMENT_MAX_IMAGE_BYTES
    : CHAT_ATTACHMENT_MAX_DOC_BYTES;
}

export function extensionForChatMime(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
    'text/plain': 'txt',
    'text/markdown': 'md',
    'application/json': 'json',
    'application/xml': 'xml',
    'text/csv': 'csv',
    'application/zip': 'zip',
    'application/x-zip-compressed': 'zip',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/rtf': 'rtf',
  };
  if (map[mimeType]) return map[mimeType];
  if (mimeType.startsWith('text/')) return 'txt';
  return 'bin';
}

export function chatAttachmentObjectKey(
  projectId: string,
  kind: ChatAttachmentKind,
  attachmentId: string,
  ext: string,
): string {
  const folder = kind === 'image' ? 'images' : 'files';
  return `chat/${projectId}/${folder}/${attachmentId}.${ext}`;
}

export function chatAttachmentRelativePath(
  kind: ChatAttachmentKind,
  attachmentId: string,
  ext: string,
): string {
  const folder = kind === 'image' ? 'images' : 'files';
  return `chat-uploads/${folder}/${attachmentId}.${ext}`;
}

/** Effective sandbox for chat attachment staging limits. */
export function resolveEffectiveSandboxActive(input: {
  agentSlug: string;
  agentSandboxEnabled?: boolean;
  projectSandboxDefaultEnabled?: boolean;
  projectSandboxDefaultMode?: string;
}): boolean {
  if (input.agentSandboxEnabled) return true;
  if (!input.projectSandboxDefaultEnabled) return false;
  if (input.projectSandboxDefaultMode === 'all') return true;
  return input.agentSlug !== 'main';
}

export function agentSlugFromSessionKey(sessionKey: string): string {
  const parts = sessionKey.split(':');
  if (parts.length >= 2 && parts[0] === 'agent') {
    return parts[1] || 'main';
  }
  return 'main';
}
