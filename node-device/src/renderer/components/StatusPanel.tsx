import type { NodeConnectionState } from "@shared/schemas/node-config.schema";
import styles from "../styles/statusPanel.module.css";

const STATE_LABEL: Record<NodeConnectionState, string> = {
  idle: "Idle",
  connecting: "Connecting",
  awaiting_approval: "Awaiting approval",
  connected: "Connected",
  error: "Error",
};

const BADGE_CLASS: Record<NodeConnectionState, string> = {
  idle: styles.idle,
  connecting: styles.connecting,
  awaiting_approval: styles.awaiting,
  connected: styles.connected,
  error: styles.error,
};

type StatusPanelProps = {
  state: NodeConnectionState;
  detail?: string;
  aucobotWebUrl?: string;
  onOpenNodes: () => void;
  onDisconnect: () => void;
  busy: boolean;
};

export function StatusPanel({
  state,
  detail,
  aucobotWebUrl,
  onOpenNodes,
  onDisconnect,
  busy,
}: StatusPanelProps) {
  const showPairingHelp = state === "awaiting_approval" || state === "connecting";

  return (
    <section class={styles.panel}>
      <div class={styles.badgeRow}>
        <span class={BADGE_CLASS[state]}>{STATE_LABEL[state]}</span>
      </div>
      {detail ? <p class={styles.detail}>{detail}</p> : null}

      {state === "connected" ? (
        <p class={styles.detail}>Node is connected and ready to receive gateway commands.</p>
      ) : null}

      {showPairingHelp ? (
        <>
          <p class={styles.detail}>
            After Connect, approve this device on the AucoBot Companion Nodes page (device + node
            pairing).
          </p>
          <ol class={styles.steps}>
            <li>Open Companion Nodes in your dashboard.</li>
            <li>Approve the pending device request (WS auth).</li>
            <li>Approve the pending node request (capabilities).</li>
          </ol>
          {aucobotWebUrl ? (
            <button type="button" class={styles.linkButton} onClick={onOpenNodes}>
              Open Companion Nodes →
            </button>
          ) : (
            <p class={styles.detail}>Set AucoBot dashboard URL in settings for a quick link.</p>
          )}
        </>
      ) : null}

      {state !== "idle" ? (
        <button
          type="button"
          class={styles.disconnect}
          disabled={busy}
          onClick={onDisconnect}
        >
          Disconnect
        </button>
      ) : null}
    </section>
  );
}
