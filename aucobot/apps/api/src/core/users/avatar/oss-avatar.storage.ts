import { Injectable } from '@nestjs/common';
import {
  assertAvatarFile,
  USER_AVATAR_API_PATH,
  type AvatarFilePayload,
  type AvatarReadResult,
  type AvatarStorage,
} from '@aucobot/runtime-contracts';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class OssAvatarStorage implements AvatarStorage {
  constructor(private readonly prisma: PrismaService) {}

  async save(userId: string, file: AvatarFilePayload): Promise<void> {
    assertAvatarFile(file);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarMimeType: file.mimeType,
        avatarData: Uint8Array.from(file.data),
        avatarStorageKey: null,
        avatarUrl: null,
      },
    });
  }

  async read(userId: string): Promise<AvatarReadResult | null> {
    const row = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarMimeType: true, avatarData: true },
    });
    if (!row?.avatarMimeType || !row.avatarData) {
      return null;
    }
    return {
      mimeType: row.avatarMimeType,
      data: Buffer.from(row.avatarData),
    };
  }

  async delete(userId: string): Promise<void> {
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
      select: { avatarMimeType: true, avatarData: true, updatedAt: true },
    });
    if (!row?.avatarMimeType || !row.avatarData) {
      return null;
    }
    return `${USER_AVATAR_API_PATH}?t=${row.updatedAt.getTime()}`;
  }
}
