import { DiskChatAttachmentStorage } from './chat-attachment.storage';

import type { ChatAttachmentStorage } from '@aucobot/runtime-contracts';

export const CHAT_ATTACHMENT_STORAGE = Symbol('CHAT_ATTACHMENT_STORAGE');

/** Chat attachment files under OPENCLAW_DATA_ROOT. */
export const chatAttachmentStorageProvider = {
  provide: CHAT_ATTACHMENT_STORAGE,
  useFactory: (): ChatAttachmentStorage => new DiskChatAttachmentStorage(),
};
