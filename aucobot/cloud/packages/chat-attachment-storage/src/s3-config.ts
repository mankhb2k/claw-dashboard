export type ChatAttachmentS3Config = {
  endpoint?: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
};

export function loadChatAttachmentS3Config(): ChatAttachmentS3Config {
  const bucket = process.env.CHAT_ATTACHMENT_S3_BUCKET?.trim();
  const accessKeyId = process.env.CHAT_ATTACHMENT_S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.CHAT_ATTACHMENT_S3_SECRET_ACCESS_KEY?.trim();
  if (!bucket || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Cloud chat attachment storage requires CHAT_ATTACHMENT_S3_BUCKET, CHAT_ATTACHMENT_S3_ACCESS_KEY_ID, CHAT_ATTACHMENT_S3_SECRET_ACCESS_KEY',
    );
  }
  return {
    endpoint: process.env.CHAT_ATTACHMENT_S3_ENDPOINT?.trim() || undefined,
    region: process.env.CHAT_ATTACHMENT_S3_REGION?.trim() || 'auto',
    bucket,
    accessKeyId,
    secretAccessKey,
    forcePathStyle: process.env.CHAT_ATTACHMENT_S3_FORCE_PATH_STYLE === 'true',
  };
}
