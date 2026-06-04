import styles from "./SettingsOverlay.module.css";

type SettingsOverlayProps = {
  open: boolean;
  onClose: () => void;
};

export function SettingsOverlay({ open, onClose }: SettingsOverlayProps) {
  return (
    <div
      class={`${styles.overlay} ${open ? styles.open : ""}`}
      onClick={onClose}
      aria-hidden={!open}
    />
  );
}
