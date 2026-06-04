import { useCallback, useEffect, useState } from "preact/hooks";
import type {
  ConnectWithInvitePayload,
  NodeConfig,
  NodeConnectionState,
} from "@shared/schemas/node-config.schema";
import type { StateEvent } from "../../preload/preload";

export function useNodeDevice() {
  const [config, setConfig] = useState<NodeConfig | null>(null);
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [state, setState] = useState<NodeConnectionState>("idle");
  const [stateDetail, setStateDetail] = useState<string | undefined>();
  const [logs, setLogs] = useState<string[]>([]);
  const [safeStorage, setSafeStorage] = useState(true);
  const [busy, setBusy] = useState(false);

  const appendLog = useCallback((line: string) => {
    setLogs((prev) => {
      const next = [...prev, line];
      return next.length > 400 ? next.slice(-400) : next;
    });
  }, []);

  const loadConfig = useCallback(async () => {
    const res = await window.nodeDevice.getConfig();
    setConfig(res.config);
    setHasSavedSession(Boolean(res.hasSavedSession));
  }, []);

  useEffect(() => {
    void (async () => {
      const meta = await window.nodeDevice.getMeta();
      setSafeStorage(meta.safeStorage);
      setState(meta.state);
      setLogs(meta.logs);
      await loadConfig();
    })();

    const offLog = window.nodeDevice.onLog(appendLog);
    const offState = window.nodeDevice.onState((event: StateEvent) => {
      setState(event.state);
      setStateDetail(event.detail);
    });

    return () => {
      offLog();
      offState();
    };
  }, [appendLog, loadConfig]);

  const saveConfig = useCallback(
    async (next: NodeConfig) => {
      setBusy(true);
      try {
        const result = await window.nodeDevice.saveConfig(next);
        if (result.ok) {
          await loadConfig();
        }
        return result;
      } finally {
        setBusy(false);
      }
    },
    [loadConfig],
  );

  const connectWithInvite = useCallback(async (payload: ConnectWithInvitePayload) => {
    setBusy(true);
    setLogs([]);
    try {
      const result = await window.nodeDevice.connectWithInvite(payload);
      if (result.ok) {
        await loadConfig();
      }
      return result;
    } finally {
      setBusy(false);
    }
  }, [loadConfig]);

  const reconnect = useCallback(async () => {
    setBusy(true);
    try {
      const result = await window.nodeDevice.reconnect();
      if (result.ok) {
        await loadConfig();
      }
      return result;
    } finally {
      setBusy(false);
    }
  }, [loadConfig]);

  const disconnect = useCallback(async () => {
    setBusy(true);
    try {
      return await window.nodeDevice.disconnect();
    } finally {
      setBusy(false);
    }
  }, []);

  const openExternal = useCallback(async (url: string) => {
    await window.nodeDevice.openExternal(url);
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  return {
    config,
    hasSavedSession,
    state,
    stateDetail,
    logs,
    safeStorage,
    busy,
    loadConfig,
    saveConfig,
    connectWithInvite,
    reconnect,
    disconnect,
    openExternal,
    clearLogs,
  };
}
