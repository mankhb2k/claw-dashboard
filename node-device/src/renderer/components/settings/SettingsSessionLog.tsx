import { useEffect, useRef, useState } from "preact/hooks";
import type { NodeConnectionState } from "@shared/schemas/node-config.schema";
import { getLogLineTone, type LogLineTone } from "./log-line-tone";
import styles from "./SettingsSessionLog.module.css";

const TONE_CLASS: Record<LogLineTone, string> = {
  default: styles.toneDefault,
  success: styles.toneSuccess,
  warn: styles.toneWarn,
  error: styles.toneError,
  muted: styles.toneMuted,
};

type SettingsSessionLogProps = {
  /** Settings sidebar đang mở — dùng để auto-scroll log */
  settingsOpen: boolean;
  logs: string[];
  state: NodeConnectionState;
  stateDetail?: string;
  onClear: () => void;
};

export function SettingsSessionLog({
  settingsOpen,
  logs,
  state,
  stateDetail,
  onClear,
}: SettingsSessionLogProps) {
  const [logOpen, setLogOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!settingsOpen || !logOpen || !scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [settingsOpen, logOpen, logs.length]);

  const handleCopy = async () => {
    if (logs.length === 0) return;
    try {
      await navigator.clipboard.writeText(logs.join("\n"));
    } catch {
      /* ignore */
    }
  };

  return (
    <section class={styles.root}>
      <button
        type="button"
        class={styles.toggle}
        onClick={() => setLogOpen((v) => !v)}
        aria-expanded={logOpen}
        aria-controls="settings-session-log-panel"
      >
        <span class={styles.toggleLabel}>Nhật ký phiên ({logs.length})</span>
        <svg
          class={logOpen ? styles.chevronOpen : styles.chevron}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {!logOpen && logs.length > 0 ? (
        <p class={styles.hint}>{logs.length} dòng log (mở để xem)</p>
      ) : null}

      {logOpen ? (
        <div id="settings-session-log-panel" class={styles.panel}>
          <p class={styles.status}>
            <span class={styles.statusKey}>Trạng thái:</span> {state.toUpperCase()}
            {stateDetail ? ` — ${stateDetail}` : ""}
          </p>

          <div class={styles.toolbar}>
            <button
              type="button"
              class={styles.toolBtn}
              onClick={() => void handleCopy()}
              disabled={logs.length === 0}
            >
              Sao chép
            </button>
            <button
              type="button"
              class={styles.toolBtnDanger}
              onClick={onClear}
              disabled={logs.length === 0}
            >
              Xóa log
            </button>
          </div>

          <div ref={scrollRef} class={styles.terminal} role="log" aria-live="polite">
            {logs.length === 0 ? (
              <p class={styles.empty}>Chưa có log trong phiên này.</p>
            ) : (
              <pre class={styles.terminalPre}>
                {logs.map((line, index) => {
                  const tone = getLogLineTone(line);
                  return (
                    <span
                      key={`${index}-${line.slice(0, 24)}`}
                      class={`${styles.logLine} ${TONE_CLASS[tone]}`}
                    >
                      {line}
                      {"\n"}
                    </span>
                  );
                })}
              </pre>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
