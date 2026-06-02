/** Max upload size for user avatars (OSS DB / Cloud object storage). */
export const AVATAR_MAX_BYTES = 512 * 1024;

export const AVATAR_ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

/** Relative API path; client prefixes with API base URL. */
export const USER_AVATAR_API_PATH = '/api/users/me/avatar';

export type AvatarFilePayload = {
  data: Buffer;
  mimeType: string;
};

export type AvatarReadResult = AvatarFilePayload;

export interface AvatarStorage {
  save(userId: string, file: AvatarFilePayload): Promise<void>;
  read(userId: string): Promise<AvatarReadResult | null>;
  delete(userId: string): Promise<void>;
  /** URL or path for <img src> — null when user has no avatar. */
  resolveDisplayUrl(userId: string): Promise<string | null>;
}

export function assertAvatarFile(file: AvatarFilePayload): void {
  if (!AVATAR_ALLOWED_MIME_TYPES.has(file.mimeType)) {
    throw new Error('Unsupported image type');
  }
  if (file.data.length === 0 || file.data.length > AVATAR_MAX_BYTES) {
    throw new Error('Avatar file size invalid');
  }
}
