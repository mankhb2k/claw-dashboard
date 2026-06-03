import styles from "../styles/logConsole.module.css";

type LogConsoleProps = {
  lines: string[];
  onClear: () => void;
};

export function LogConsole({ lines, onClear }: LogConsoleProps) {
  const text = lines.length > 0 ? lines.join("\n") : "No logs yet. Connect to see OpenClaw CLI output.";

  return (
    <section class={styles.console}>
      <div class={styles.header}>
        <h2 class={styles.title}>Logs</h2>
        <button type="button" class={styles.clear} onClick={onClear}>
          Clear
        </button>
      </div>
      <pre class={`${styles.log} ${lines.length === 0 ? styles.empty : ""}`}>{text}</pre>
    </section>
  );
}
