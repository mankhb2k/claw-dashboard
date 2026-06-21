import { PostgresAvatarStorage } from './avatar.storage';
import { PrismaService } from '../../database/prisma.service';

import type { AvatarStorage } from '@aucobot/runtime-contracts';

export const AVATAR_STORAGE = Symbol('AVATAR_STORAGE');

/** Avatar bytes stored in PostgreSQL. */
export const avatarStorageProvider = {
  provide: AVATAR_STORAGE,
  useFactory: (prisma: PrismaService): AvatarStorage =>
    new PostgresAvatarStorage(prisma),
  inject: [PrismaService],
};
