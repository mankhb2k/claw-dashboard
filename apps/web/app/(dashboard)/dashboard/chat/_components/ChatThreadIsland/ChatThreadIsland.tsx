"use client";

import { memo } from "react";

import { ChatLiveThread } from "../ChatLiveThread/ChatLiveThread";
import { ChatMessageBubble } from "../ChatMessageBubble/ChatMessageBubble";

import type { ChatPanelMessage } from "../ChatPanel/ChatPanel";
import type { LiveThreadItem } from "@/utils/chat/tool/types";

export type ChatThreadIslandProps = {
  messages: ChatPanelMessage[];
  streamText: string;
  liveItems: LiveThreadItem[];
  showToolPreparing: boolean;
};

function ChatThreadIslandComponent({
  messages,
  streamText,
  liveItems,
  showToolPreparing,
}: ChatThreadIslandProps) {
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
}

export const ChatThreadIsland = memo(ChatThreadIslandComponent);
