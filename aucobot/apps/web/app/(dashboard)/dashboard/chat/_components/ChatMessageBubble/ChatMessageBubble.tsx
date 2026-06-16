import { memo } from "react";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown/ChatMarkdown";
import { isVisibleChatBubbleText } from "@/utils/chat/stream/history-filter";
import styles from "./ChatMessageBubble.module.css";

export type ChatMessageBubbleProps = {
  role: string;
  text: string;
  streaming?: boolean;
};

export const ChatMessageBubble = memo(function ChatMessageBubble({
  role,
  text,
  streaming,
}: ChatMessageBubbleProps) {
  const isUser = role === "user";

  if (!isVisibleChatBubbleText(role, text)) {
    return null;
  }

  if (isUser) {
    return (
      <article
        className={`${styles.row} ${styles.rowUser}`}
        data-role={role}
      >
        <div className={styles.userBubble}>
          <p className={styles.userText}>{text}</p>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`${styles.row} ${styles.rowAssistant}`}
      data-role={role}
    >
      <div className={styles.assistantBody}>
        <ChatMarkdown content={text} streaming={streaming} />
      </div>
    </article>
  );
});
