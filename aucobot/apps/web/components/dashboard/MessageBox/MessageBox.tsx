"use client";

import type {
  ComposerAttachment,
  ComposerSendPayload,
} from "./AttachmentPreviewRow/composer-attachments";
import { MessageBoxChat } from "./MessageBoxChat";
import { MessageBoxSimple } from "./MessageBoxSimple";
import type {
  MessageBoxChatProps,
  MessageBoxProps,
  MessageBoxSimpleProps,
} from "./message-box.types";

export type {
  MessageBoxChatProps,
  MessageBoxProps,
  MessageBoxSimpleProps,
} from "./message-box.types";

export function MessageBox(props: MessageBoxProps) {
  if (props.enableAttachments === true) {
    return <MessageBoxChat {...(props as MessageBoxChatProps)} />;
  }
  return <MessageBoxSimple {...(props as MessageBoxSimpleProps)} />;
}

export type { ComposerAttachment, ComposerSendPayload };
