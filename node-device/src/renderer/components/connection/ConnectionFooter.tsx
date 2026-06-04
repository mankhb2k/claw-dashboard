import type { NodeConnectionState } from "@shared/schemas/node-config.schema";
import styles from "./ConnectionFooter.module.css";

type ConnectionFooterProps = {
  state: NodeConnectionState;
  logCount: number;
};

export function ConnectionFooter({ state, logCount }: ConnectionFooterProps) {
  const active = state === "connected" || state === "connecting" || state === "awaiting_approval";

  return (
    <footer class={styles.footer}>
      <div class={styles.stat}>
        <div class={`${styles.iconBox} ${active ? styles.iconBoxPrimary : styles.iconBoxMuted}`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <p class={styles.label}>Trạng thái gateway</p>
          <p class={styles.value}>{state.toUpperCase()}</p>
        </div>
      </div>

      <div class={styles.stat}>
        <div class={`${styles.iconBox} ${active ? styles.iconBoxCyan : styles.iconBoxMuted}`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <p class={styles.label}>Nhật ký phiên</p>
          <p class={styles.value}>{logCount} dòng</p>
        </div>
      </div>
    </footer>
  );
}
