import styles from "./SmallToggle.module.css";

type SmallToggleProps = {
  on: boolean;
  onChange: (next: boolean) => void;
  label: string;
};

export function SmallToggle({ on, onChange, label }: SmallToggleProps) {
  return (
    <button
      type="button"
      class={`${styles.track} ${on ? styles.trackOn : ""}`}
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
    >
      <span class={`${styles.dot} ${on ? styles.dotOn : ""}`} />
    </button>
  );
}
