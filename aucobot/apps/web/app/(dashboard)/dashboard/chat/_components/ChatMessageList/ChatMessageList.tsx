"use client";

import { memo } from "react";
import type { LiveThreadItem } from "@/utils/chat/tool/types";
import { ChatLiveThread } from "../ChatLiveThread/ChatLiveThread";
import { ChatMessageBubble } from "../ChatMessageBubble/ChatMessageBubble";

export type ChatMessageListMessage = {
  id: string;
  role: string;
  text: string;
};

export type ChatMessageListProps = {
  messages: ChatMessageListMessage[];
  streamText: string;
  liveItems?: LiveThreadItem[];
  showToolPreparing?: boolean;
};

export const ChatMessageList = memo(function ChatMessageList({
  messages,
  streamText,
  liveItems = [],
  showToolPreparing = false,
}: ChatMessageListProps) {
  return (
    <>
      {messages.map((message) => (
        <ChatMessageBubble
          key={message.id}
          role={message.role}
          text={message.text}
        />
      ))}

      <ChatLiveThread
        liveItems={liveItems}
        showToolPreparing={showToolPreparing}
      />

      {streamText ? (
        <ChatMessageBubble role="assistant" text={streamText} streaming />
      ) : null}
    </>
  );
});
