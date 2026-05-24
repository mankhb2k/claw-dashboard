import { Bot } from 'lucide-react'
import styles from './ChatTypingIndicator.module.css'

export function ChatTypingIndicator() {
  return (
    <div className={styles.row} aria-live="polite" aria-label="Agent đang suy nghĩ">
      <div className={styles.avatar} aria-hidden>
        <Bot size={16} />
      </div>
      <div className={styles.bubble}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
    </div>
  )
}
