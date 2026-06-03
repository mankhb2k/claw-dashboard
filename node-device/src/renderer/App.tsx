import { SetupForm } from "./components/SetupForm";
import { StatusPanel } from "./components/StatusPanel";
import { LogConsole } from "./components/LogConsole";
import { useNodeDevice } from "./hooks/useNodeDevice";
import styles from "./styles/app.module.css";

export function App() {
  const {
    config,
    hasToken,
    state,
    stateDetail,
    logs,
    safeStorage,
    busy,
    connect,
    connectWithInvite,
    disconnect,
    saveConfig,
    testGateway,
    openExternal,
    clearLogs,
  } = useNodeDevice();

  const nodesUrl = config?.aucobotWebUrl
    ? `${config.aucobotWebUrl.replace(/\/$/, "")}/dashboard/nodes`
    : undefined;

  return (
    <div class={styles.app}>
      <header class={styles.header}>
        <h1 class={styles.title}>OpenClaw Node</h1>
        <p class={styles.subtitle}>
          Desktop companion node — connects to your OpenClaw gateway via the CLI.
        </p>
      </header>

      {!safeStorage ? (
        <div class={`${styles.banner} ${styles.bannerWarn}`}>
          OS encryption is unavailable; config is stored locally without extra protection.
        </div>
      ) : null}

      <SetupForm
        initial={config}
        hasStoredToken={hasToken}
        busy={busy}
        onConnect={connect}
        onConnectWithInvite={connectWithInvite}
        onSave={saveConfig}
        onTest={testGateway}
      />

      <StatusPanel
        state={state}
        detail={stateDetail}
        aucobotWebUrl={nodesUrl}
        busy={busy}
        onOpenNodes={() => {
          if (nodesUrl) void openExternal(nodesUrl);
        }}
        onDisconnect={() => void disconnect()}
      />

      <LogConsole lines={logs} onClear={clearLogs} />
    </div>
  );
}
