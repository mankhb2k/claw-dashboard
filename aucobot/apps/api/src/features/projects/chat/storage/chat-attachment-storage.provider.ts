import { isOssRuntime, type ChatAttachmentStorage } from '@aucobot/runtime-contracts';
import { PrismaService } from '../../../../core/database/prisma.service';
import { LocalChatAttachmentStorage } from './local-chat-attachment.storage';

export const CHAT_ATTACHMENT_STORAGE = Symbol('CHAT_ATTACHMENT_STORAGE');

export const chatAttachmentStorageProvider = {
  provide: CHAT_ATTACHMENT_STORAGE,
  useFactory: (prisma: PrismaService): ChatAttachmentStorage => {
    if (isOssRuntime()) {
      return new LocalChatAttachmentStorage();
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { CloudChatAttachmentStorage } = require('@aucobot-cloud/chat-attachment-storage') as {
      CloudChatAttachmentStorage: new (prisma: PrismaService) => ChatAttachmentStorage;
    };
    return new CloudChatAttachmentStorage(prisma);
  },
  inject: [PrismaService],
};
