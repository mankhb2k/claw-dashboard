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

  const robotClass =
    mode === "connected"
      ? styles.connected
      : mode === "pending"
        ? styles.pending
        : "";

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
        <span
          class={`${styles.badgeText} ${mode === "disconnected" && state === "error" ? styles.badgeTextDanger : ""}`}
        >
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

      <div class={styles.sceneWrap}>
        <div class={`${styles.robotContainer} ${robotClass}`}>
          <div class={styles.groundShadow} aria-hidden="true" />

          <svg
            class={styles.robotSvg}
            viewBox="0 0 272 272"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <radialGradient id="connectionRobotBody3D" cx="35%" cy="20%" r="75%" fx="30%" fy="20%">
                <stop offset="0%" stop-color="#FFDAB9" />
                <stop offset="15%" stop-color="#FF6A00" />
                <stop offset="45%" stop-color="#E64500" />
                <stop offset="80%" stop-color="#801500" />
                <stop offset="100%" stop-color="#220500" />
              </radialGradient>

              <linearGradient id="connectionRobotVisorGlass" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#333333" stop-opacity="0.9" />
                <stop offset="15%" stop-color="#0a0a0a" stop-opacity="1" />
                <stop offset="50%" stop-color="#000000" stop-opacity="1" />
                <stop offset="100%" stop-color="#050505" stop-opacity="1" />
              </linearGradient>

              <filter id="connectionRobotVisorPopOut" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="14" stdDeviation="12" flood-color="#4a0e00" flood-opacity="0.9" />
                <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.95" />
              </filter>

              <radialGradient id="connectionRobotEye3D" cx="40%" cy="30%" r="60%">
                <stop offset="0%" stop-color="var(--eye-light)" />
                <stop offset="60%" stop-color="var(--eye-base)" />
                <stop offset="100%" stop-color="var(--eye-dark)" />
              </radialGradient>
            </defs>

            <g class={styles.robotGroup}>
              <path
                d="M136.304 14C172.39 14 205.205 31.4977 229.057 57.5771C252.921 83.6702 267.606 118.137 267.606 151.675C267.606 185.074 253.047 211.289 229.454 229.234C205.786 247.237 172.893 257 136.304 257C99.7142 257 66.8216 247.237 43.1533 229.234C19.5599 211.289 5 185.074 5 151.675C5.00011 118.137 19.6862 83.6702 43.5508 57.5771C67.4029 31.4978 100.217 14 136.304 14Z"
                fill="url(#connectionRobotBody3D)"
              />

              <path
                class={styles.visor}
                d="M45 99.25C104.107 90.2398 164.228 90.1103 223.373 98.8672L225.895 99.2412C236.882 100.868 245.019 110.298 245.019 121.405V177.173C245.018 188.21 236.937 197.582 226.021 199.207L224.382 199.451C164.952 208.294 104.535 208.211 45.1299 199.202C34.4782 197.587 26.6057 188.43 26.6055 177.656V120.66C26.6057 109.959 34.4213 100.863 45 99.25Z"
                fill="url(#connectionRobotVisorGlass)"
                filter="url(#connectionRobotVisorPopOut)"
              />

              <ellipse
                class={`${styles.eye} ${styles.eyeLeft}`}
                cx="90.2266"
                cy="149.224"
                rx="20"
                ry="28"
                fill="url(#connectionRobotEye3D)"
              />
              <ellipse
                class={`${styles.eye} ${styles.eyeRight}`}
                cx="182.379"
                cy="149.224"
                rx="20"
                ry="28"
                fill="url(#connectionRobotEye3D)"
              />
            </g>
          </svg>
        </div>

        <div class={styles.bgEffects} aria-hidden="true">
          <div class={`${styles.ring} ${styles.ring1}`} />
          <div class={`${styles.ring} ${styles.ring2}`} />
          <div class={`${styles.ring} ${styles.ring3}`} />
        </div>
      </div>
    </div>
  );
}
