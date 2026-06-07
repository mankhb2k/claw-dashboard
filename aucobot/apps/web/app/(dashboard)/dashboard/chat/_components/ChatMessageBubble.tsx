import { Bot, User } from "lucide-react";
import styles from "./ChatMessageBubble.module.css";

export type ChatMessageBubbleProps = {
  role: string;
  text: string;
  streaming?: boolean;
};

export function ChatMessageBubble({
  role,
  text,
  streaming,
}: ChatMessageBubbleProps) {
  const isUser = role === "user";

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
        {streaming ? (
          <span className={styles.streaming}>Agent đang trả lời…</span>
        ) : null}
        <div className={styles.assistantText}>{text}</div>
      </div>
    </article>
  );
}
