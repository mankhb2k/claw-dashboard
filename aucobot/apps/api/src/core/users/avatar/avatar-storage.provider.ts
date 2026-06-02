import { isOssRuntime, type AvatarStorage } from '@aucobot/runtime-contracts';
import { PrismaService } from '../../database/prisma.service';
import { OssAvatarStorage } from './oss-avatar.storage';

export const AVATAR_STORAGE = Symbol('AVATAR_STORAGE');

export const avatarStorageProvider = {
  provide: AVATAR_STORAGE,
  useFactory: (prisma: PrismaService): AvatarStorage => {
    if (isOssRuntime()) {
      return new OssAvatarStorage(prisma);
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { CloudAvatarStorage } = require('@aucobot-cloud/avatar-storage') as {
      CloudAvatarStorage: new (prisma: PrismaService) => AvatarStorage;
    };
    return new CloudAvatarStorage(prisma);
  },
  inject: [PrismaService],
};
