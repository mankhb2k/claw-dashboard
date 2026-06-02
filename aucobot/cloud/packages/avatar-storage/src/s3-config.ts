export type AvatarS3Config = {
  endpoint?: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl?: string;
  forcePathStyle: boolean;
};

export function loadAvatarS3Config(): AvatarS3Config {
  const bucket = process.env.AVATAR_S3_BUCKET?.trim();
  const accessKeyId = process.env.AVATAR_S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AVATAR_S3_SECRET_ACCESS_KEY?.trim();
  if (!bucket || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Cloud avatar storage requires AVATAR_S3_BUCKET, AVATAR_S3_ACCESS_KEY_ID, AVATAR_S3_SECRET_ACCESS_KEY',
    );
  }
  return {
    endpoint: process.env.AVATAR_S3_ENDPOINT?.trim() || undefined,
    region: process.env.AVATAR_S3_REGION?.trim() || 'auto',
    bucket,
    accessKeyId,
    secretAccessKey,
    publicBaseUrl: process.env.AVATAR_PUBLIC_BASE_URL?.trim() || undefined,
    forcePathStyle: process.env.AVATAR_S3_FORCE_PATH_STYLE === 'true',
  };
}

export function avatarObjectKey(userId: string): string {
  return `users/${userId}/avatar`;
}
