import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  chatAttachmentObjectKey,
  extensionForChatMime,
  type ChatAttachmentReadResult,
  type ChatAttachmentSaveInput,
  type ChatAttachmentSaveResult,
  type ChatAttachmentStorage,
  type ChatAttachmentStorageRef,
} from '@aucobot/runtime-contracts';
import { loadChatAttachmentS3Config } from './s3-config.js';

export class CloudChatAttachmentStorage implements ChatAttachmentStorage {
  private readonly s3: S3Client;
  private readonly config = loadChatAttachmentS3Config();

  constructor(_prisma?: unknown) {
    this.s3 = new S3Client({
      region: this.config.region,
      endpoint: this.config.endpoint,
      forcePathStyle: this.config.forcePathStyle,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });
  }

  async save(input: ChatAttachmentSaveInput): Promise<ChatAttachmentSaveResult> {
    const ext = extensionForChatMime(input.mimeType);
    const key = chatAttachmentObjectKey(
      input.projectId,
      input.kind,
      input.attachmentId,
      ext,
    );
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: input.buffer,
        ContentType: input.mimeType,
        CacheControl: 'private, no-store',
      }),
    );
    return {
      storageKey: key,
      sizeBytes: input.buffer.length,
    };
  }

  async read(
    _projectId: string,
    ref: ChatAttachmentStorageRef,
  ): Promise<ChatAttachmentReadResult> {
    if (!ref.storageKey?.trim()) {
      throw new Error('Missing storageKey');
    }
    const out = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: ref.storageKey,
      }),
    );
    const bytes = await out.Body?.transformToByteArray();
    if (!bytes) {
      throw new Error('Empty object');
    }
    return {
      buffer: Buffer.from(bytes),
      mimeType: out.ContentType ?? 'application/octet-stream',
    };
  }

  async delete(_projectId: string, ref: ChatAttachmentStorageRef): Promise<void> {
    if (!ref.storageKey?.trim()) return;
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.config.bucket,
          Key: ref.storageKey,
        }),
      );
    } catch {
      /* ignore missing */
    }
  }
}
