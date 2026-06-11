import styles from "./ChatTypingIndicator.module.css";

export function ChatTypingIndicator() {
  return (
    <div className={styles.row} aria-live="polite" aria-label="Agent is thinking">
      <div className={styles.dots}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
    </div>
  );
}
