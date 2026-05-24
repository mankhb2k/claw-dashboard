import { Bot, User } from 'lucide-react'
import styles from './ChatMessageBubble.module.css'

export type ChatMessageBubbleProps = {
  role: string
  text: string
  streaming?: boolean
}

export function ChatMessageBubble({ role, text, streaming }: ChatMessageBubbleProps) {
  const isUser = role === 'user'

  return (
    <article
      className={`${styles.row} ${isUser ? styles.rowUser : styles.rowAssistant}`}
      data-role={role}
    >
      <div
        className={`${styles.avatar} ${isUser ? styles.avatarUser : styles.avatarAgent}`}
        aria-hidden
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAssistant}`}>
        <header className={styles.meta}>
          <span className={styles.name}>{isUser ? 'Bạn' : 'Agent'}</span>
          {streaming && <span className={styles.streaming}>đang trả lời…</span>}
        </header>
        <p className={styles.text}>{text}</p>
      </div>
    </article>
  )
}
