import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  assertAvatarFile,
  USER_AVATAR_API_PATH,
  type AvatarFilePayload,
  type AvatarReadResult,
  type AvatarStorage,
} from '@aucobot/runtime-contracts';
import { avatarObjectKey, loadAvatarS3Config } from './s3-config.js';

type PrismaLike = {
  user: {
    update: (args: {
      where: { id: string };
      data: Record<string, unknown>;
    }) => Promise<unknown>;
    findUnique: (args: {
      where: { id: string };
      select: Record<string, boolean>;
    }) => Promise<{
      avatarMimeType: string | null;
      avatarStorageKey: string | null;
      avatarUrl: string | null;
      updatedAt?: Date;
    } | null>;
  };
};

export class CloudAvatarStorage implements AvatarStorage {
  private readonly s3: S3Client;
  private readonly config = loadAvatarS3Config();

  constructor(private readonly prisma: PrismaLike) {
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

  async save(userId: string, file: AvatarFilePayload): Promise<void> {
    assertAvatarFile(file);
    const key = avatarObjectKey(userId);
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: file.data,
        ContentType: file.mimeType,
        CacheControl: 'private, max-age=3600',
      }),
    );
    const publicUrl = this.config.publicBaseUrl
      ? `${this.config.publicBaseUrl.replace(/\/$/, '')}/${key}`
      : null;
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarMimeType: file.mimeType,
        avatarData: null,
        avatarStorageKey: key,
        avatarUrl: publicUrl,
      },
    });
  }

  async read(userId: string): Promise<AvatarReadResult | null> {
    const row = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarMimeType: true, avatarStorageKey: true },
    });
    if (!row?.avatarMimeType || !row.avatarStorageKey) {
      return null;
    }
    const out = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: row.avatarStorageKey,
      }),
    );
    const bytes = await out.Body?.transformToByteArray();
    if (!bytes) {
      return null;
    }
    return {
      mimeType: row.avatarMimeType,
      data: Buffer.from(bytes),
    };
  }

  async delete(userId: string): Promise<void> {
    const key = avatarObjectKey(userId);
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
        }),
      );
    } catch {
      // ignore missing object
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarMimeType: null,
        avatarData: null,
        avatarStorageKey: null,
        avatarUrl: null,
      },
    });
  }

  async resolveDisplayUrl(userId: string): Promise<string | null> {
    const row = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        avatarMimeType: true,
        avatarStorageKey: true,
        avatarUrl: true,
        updatedAt: true,
      },
    });
    if (!row?.avatarMimeType || !row.avatarStorageKey) {
      return null;
    }
    if (row.avatarUrl?.trim()) {
      return row.avatarUrl.trim();
    }
    const updatedAt = row.updatedAt ?? new Date();
    return `${USER_AVATAR_API_PATH}?t=${updatedAt.getTime()}`;
  }
}
