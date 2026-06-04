import type { NodeConnectionState } from "@shared/schemas/node-config.schema";
import styles from "./ConnectionCore.module.css";

type ConnectionCoreProps = {
  state: NodeConnectionState;
  displayName?: string;
  detail?: string;
};

function visualMode(state: NodeConnectionState): "connected" | "pending" | "disconnected" {
  if (state === "connected") return "connected";
  if (state === "connecting" || state === "awaiting_approval") return "pending";
  return "disconnected";
}

export function ConnectionCore({ state, displayName, detail }: ConnectionCoreProps) {
  const mode = visualMode(state);

  const badgeLabel =
    state === "connected"
      ? "NODE ACTIVE"
      : state === "awaiting_approval"
        ? "AWAITING APPROVAL"
        : state === "connecting"
          ? "CONNECTING"
          : state === "error"
            ? "ERROR"
            : "OFFLINE";

  const coreLabel =
    state === "connected" ? "SẴN SÀNG" : state === "awaiting_approval" ? "CHỜ DUYỆT" : "NGẮT";

  return (
    <div class={styles.statusMeta}>
      <div class={styles.badge}>
        <span
          class={`${styles.dot} ${
            mode === "connected"
              ? styles.dotConnected
              : mode === "pending"
                ? styles.dotPending
                : styles.dotDisconnected
          }`}
        />
        <span class={`${styles.badgeText} ${mode === "disconnected" && state === "error" ? styles.badgeTextDanger : ""}`}>
          {badgeLabel}
        </span>
      </div>

      <p class={styles.subline}>
        {displayName ? (
          <>
            Node: <strong>{displayName}</strong>
          </>
        ) : (
          "Companion node cho gateway AucoBot"
        )}
        {detail ? <> — {detail}</> : null}
      </p>

      <div class={mode !== "disconnected" ? styles.active : styles.disconnected}>
        <div class={styles.pulseWrap}>
          <div class={`${styles.pulseRing} ${styles.pulseRing1}`} />
          <div class={`${styles.pulseRing} ${styles.pulseRing2}`} />
          <div class={`${styles.pulseRing} ${styles.pulseRing3}`} />

          <div
            class={`${styles.core} ${
              mode === "connected"
                ? styles.coreConnected
                : mode === "pending"
                  ? styles.corePending
                  : styles.coreDisconnected
            }`}
          >
            <div class={styles.coreIconBg}>
              {mode === "disconnected" ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              )}
            </div>
            <span
              class={`${styles.coreLabel} ${
                mode === "disconnected" ? styles.labelDisconnected : mode === "pending" ? styles.labelPending : styles.labelConnected
              }`}
            >
              {coreLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
