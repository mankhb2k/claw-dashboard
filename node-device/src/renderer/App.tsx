import { useCallback, useMemo, useState } from "preact/hooks";
import { AppBackground } from "./components/layout/AppBackground";
import { AppHeader } from "./components/layout/AppHeader";
import { ConnectionCore } from "./components/connection/ConnectionCore";
import { ConnectionToggle } from "./components/connection/ConnectionToggle";
import { ConnectionStatusText } from "./components/connection/ConnectionStatusText";
import { ConnectionFooter } from "./components/connection/ConnectionFooter";
import { InviteModal } from "./components/invite/InviteModal";
import { SettingsOverlay } from "./components/settings/SettingsOverlay";
import { SettingsSidebar } from "./components/settings/SettingsSidebar";
import { DEFAULT_PERMISSIONS } from "./components/settings/PermissionToggles";
import { useConnectionTimer } from "./hooks/useConnectionTimer";
import { useNodeDevice } from "./hooks/useNodeDevice";
import styles from "./styles/app.module.css";

export function App() {
  const {
    config,
    hasSavedSession,
    state,
    stateDetail,
    logs,
    safeStorage,
    busy,
    saveConfig,
    connectWithInvite,
    reconnect,
    disconnect,
    openExternal,
    clearLogs,
  } = useNodeDevice();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteError, setInviteError] = useState<string | undefined>();

  const connected = state === "connected";
  const sessionActive =
    connected || state === "connecting" || state === "awaiting_approval";
  /** Toggle ON / đang kết nối — bật grid, glow, ripple như HTML mẫu */
  const visualsActive = sessionActive;

  const timerLabel = useConnectionTimer(connected);

  const nodesUrl = useMemo(() => {
    if (!config?.aucobotWebUrl) return undefined;
    return `${config.aucobotWebUrl.replace(/\/$/, "")}/dashboard/nodes`;
  }, [config?.aucobotWebUrl]);

  const handleToggle = useCallback(async () => {
    if (sessionActive) {
      await disconnect();
      return;
    }

    if (hasSavedSession) {
      setInviteError(undefined);
      setInviteOpen(false);
      await reconnect();
      return;
    }

    setInviteError(undefined);
    setInviteOpen(true);
  }, [sessionActive, hasSavedSession, disconnect, reconnect]);

  const handleInviteSubmit = useCallback(
    async (payload: { webBaseUrl: string; inviteCode: string }) => {
      setInviteError(undefined);
      const result = await connectWithInvite({
        webBaseUrl: payload.webBaseUrl,
        inviteCode: payload.inviteCode,
        displayName: config?.displayName,
        openAtLogin: config?.openAtLogin,
        permissions: config?.permissions ?? DEFAULT_PERMISSIONS,
      });

      if (!result.ok) {
        const message =
          result.message ??
          (result.errors ? Object.values(result.errors).join(" ") : "Kết nối thất bại.");
        const alreadyUsed = /đã được sử dụng|already used|đã dùng/i.test(message);
        if (alreadyUsed && hasSavedSession) {
          setInviteError(undefined);
          setInviteOpen(false);
          await reconnect();
          return;
        }
        setInviteError(message);
        return;
      }

      setInviteError(undefined);
      setInviteOpen(false);
    },
    [connectWithInvite, config],
  );

  const handleForgetPairing = useCallback(async () => {
    await disconnect();
    await window.nodeDevice.clearConfig();
    setSettingsOpen(false);
    setInviteOpen(false);
  }, [disconnect]);

  return (
    <div
      class={`${styles.shell} ${visualsActive ? styles.shellConnected : styles.shellDisconnected}`}
    >
      <AppBackground active={visualsActive} />

      {!safeStorage ? (
        <div class={styles.banner}>
          OS encryption unavailable — config stored without extra protection.
        </div>
      ) : null}

      <AppHeader connected={visualsActive} onOpenSettings={() => setSettingsOpen(true)} />

      <main class={styles.main}>
        <ConnectionCore
          state={state}
          displayName={config?.displayName}
          detail={stateDetail}
        />

        <ConnectionToggle on={sessionActive} busy={busy} onToggle={() => void handleToggle()} />

        <ConnectionStatusText state={state} timerLabel={timerLabel} />
      </main>

      <ConnectionFooter state={state} logCount={logs.length} />

      <InviteModal
        open={inviteOpen}
        busy={busy}
        initialWebUrl={config?.aucobotWebUrl || "http://localhost:3000"}
        error={inviteError}
        onClose={() => setInviteOpen(false)}
        onSubmit={(payload) => void handleInviteSubmit(payload)}
      />

      <SettingsOverlay open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <SettingsSidebar
        open={settingsOpen}
        busy={busy}
        config={config}
        logs={logs}
        connectionState={state}
        connectionDetail={stateDetail}
        onClose={() => setSettingsOpen(false)}
        onSave={async (patch) => {
          if (!config?.gatewayUrl) {
            return { ok: false, message: "Missing gateway config" };
          }
          return saveConfig({ ...config, ...patch });
        }}
        onOpenNodes={() => {
          if (nodesUrl) void openExternal(nodesUrl);
        }}
        onForgetPairing={() => void handleForgetPairing()}
        onClearLogs={clearLogs}
      />
    </div>
  );
}
