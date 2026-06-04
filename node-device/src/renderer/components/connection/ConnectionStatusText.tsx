import type { NodeConnectionState } from "@shared/schemas/node-config.schema";
import styles from "./ConnectionStatusText.module.css";

type ConnectionStatusTextProps = {
  state: NodeConnectionState;
  timerLabel: string;
};

export function ConnectionStatusText({ state, timerLabel }: ConnectionStatusTextProps) {
  const connected = state === "connected";
  const pending = state === "connecting" || state === "awaiting_approval";

  const title = connected ? "CONNECTED" : pending ? "PAIRING" : state === "error" ? "ERROR" : "DISCONNECTED";

  const sub = connected
    ? "Node đã kết nối gateway và sẵn sàng nhận lệnh từ agent."
    : pending
      ? "Mở Companion Nodes trên dashboard để duyệt device và node."
      : state === "error"
        ? "Kiểm tra log hoặc thử pairing lại với mã invite mới."
        : "Bật toggle để nhập mã pairing và kết nối an toàn qua dashboard.";

  return (
    <div class={styles.wrap}>
      <h2
        class={`${styles.title} ${
          connected ? styles.titleConnected : pending ? styles.titlePending : styles.titleDisconnected
        }`}
      >
        {title}
      </h2>
      <div class={`${styles.timerRow} ${connected ? "" : styles.timerRowDim}`}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class={styles.timer}>{timerLabel}</span>
      </div>
      <p class={styles.sub}>{sub}</p>
    </div>
  );
}
