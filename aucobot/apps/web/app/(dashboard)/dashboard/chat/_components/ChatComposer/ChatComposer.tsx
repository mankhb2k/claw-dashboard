"use client";

import { memo } from "react";
import { MessageBoxChat } from "@/components/dashboard/MessageBox/MessageBoxChat";
import type { MessageBoxChatViewProps } from "@/components/dashboard/MessageBox/message-box.types";

export type ChatComposerProps = MessageBoxChatViewProps;

export const ChatComposer = memo(function ChatComposer(props: ChatComposerProps) {
  return <MessageBoxChat {...props} />;
});
