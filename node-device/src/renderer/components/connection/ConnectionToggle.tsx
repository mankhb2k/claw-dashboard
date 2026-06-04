import styles from "./ConnectionToggle.module.css";

type ConnectionToggleProps = {
  on: boolean;
  busy: boolean;
  onToggle: () => void;
};

export function ConnectionToggle({ on, busy, onToggle }: ConnectionToggleProps) {
  return (
    <div class={styles.wrap}>
      <button
        type="button"
        class={`${styles.track} ${on ? styles.trackOn : ""} ${busy ? styles.trackDisabled : ""}`}
        disabled={busy}
        onClick={onToggle}
        aria-pressed={on}
        aria-label={on ? "Disconnect node" : "Connect node"}
      >
        <span class={styles.labelOn}>ON</span>
        <span class={styles.labelOff}>OFF</span>
        <span class={`${styles.handle} ${on ? styles.handleOn : ""}`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
          </svg>
        </span>
      </button>
      <span class={styles.hint}>{busy ? "ĐANG XỬ LÝ…" : on ? "GẠT ĐỂ TẮT" : "GẠT ĐỂ BẬT"}</span>
    </div>
  );
}
