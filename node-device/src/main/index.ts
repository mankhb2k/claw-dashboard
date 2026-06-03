import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  nativeImage,
  shell,
  Tray,
} from "electron";
import path from "node:path";
import { formatZodErrors } from "../shared/parse";
import {
  connectPayloadSchema,
  connectWithInviteSchema,
  nodeConfigSchema,
  type ConnectPayload,
  type ConnectWithInvitePayload,
  type NodeConfig,
  type NodeConnectionState,
  type StoredConfig,
} from "../shared/schemas/node-config.schema";
import {
  clearStoredConfig,
  isSafeStorageAvailable,
  loadStoredConfig,
  saveStoredConfig,
} from "./config-store";
import { parseGatewayUrl, toWsPortHint } from "./gateway-url";
import { NodeRunner } from "./node-runner";
import { redeemNodeInvite } from "./redeem-invite";

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let logs: string[] = [];
const MAX_LOGS = 400;

const runner = new NodeRunner(
  (state, detail) => {
    broadcastState(state, detail);
    updateTrayTooltip(state);
  },
  (line) => {
    logs.push(line);
    if (logs.length > MAX_LOGS) {
      logs = logs.slice(-MAX_LOGS);
    }
    mainWindow?.webContents.send("node-device:log", line);
  },
);

function pushLog(line: string): void {
  logs.push(line);
  if (logs.length > MAX_LOGS) {
    logs = logs.slice(-MAX_LOGS);
  }
  mainWindow?.webContents.send("node-device:log", line);
}

function broadcastState(state: NodeConnectionState, detail?: string): void {
  mainWindow?.webContents.send("node-device:state", { state, detail });
}

function updateTrayTooltip(state: NodeConnectionState): void {
  if (!tray) return;
  tray.setToolTip(`OpenClaw Node — ${state}`);
}

function getRendererUrl(): string {
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (isDev && devUrl) {
    return devUrl;
  }
  return path.join(__dirname, "../renderer/index.html");
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 520,
    height: 720,
    minWidth: 420,
    minHeight: 560,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const target = getRendererUrl();
  if (target.startsWith("http")) {
    void mainWindow.loadURL(target);
  } else {
    void mainWindow.loadFile(target);
  }

  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

const TRAY_ICON =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMElEQVQ4T2NkYGD4z0AEYBxVSFSAxWBEA1j8P5oGsPg/mgaw+D+aBrD4P5oGAAAbXgJ0f8p0YQAAAABJRU5ErkJggg==";

function createTray(): void {
  const icon = nativeImage.createFromDataURL(TRAY_ICON);
  tray = new Tray(icon);
  tray.setToolTip("OpenClaw Node — idle");
  rebuildTrayMenu();

  tray.on("double-click", () => {
    if (!mainWindow) {
      createWindow();
      return;
    }
    mainWindow.show();
    mainWindow.focus();
  });
}

function rebuildTrayMenu(): void {
  if (!tray) return;
  const running = runner.isRunning();
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "Show window",
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    { type: "separator" },
    {
      label: running ? "Disconnect node" : "Connect (open window)",
      enabled: true,
      click: () => {
        if (running) {
          runner.stop();
          pushLog("Node stopped from tray.");
          return;
        }
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.isQuitting = true;
        runner.stop();
        app.quit();
      },
    },
  ];
  tray.setContextMenu(Menu.buildFromTemplate(template));
}

async function testGatewayReachable(gatewayUrl: string): Promise<{ ok: boolean; message?: string }> {
  try {
    const endpoint = parseGatewayUrl(gatewayUrl);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(endpoint.httpBase, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok || res.status === 404 || res.status === 401) {
      return { ok: true, message: `Gateway reachable at ${endpoint.httpBase}` };
    }
    return { ok: false, message: `Gateway responded with HTTP ${res.status}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gateway unreachable";
    return { ok: false, message };
  }
}

function registerIpc(): void {
  ipcMain.handle("node-device:get-meta", () => ({
    safeStorage: isSafeStorageAvailable(),
    isDev,
    logs,
    state: runner.getState(),
  }));

  ipcMain.handle("node-device:get-config", () => {
    const config = loadStoredConfig();
    if (!config) {
      return { config: null as StoredConfig | null };
    }
    const { gatewayToken: _token, ...publicConfig } = config;
    return {
      config: publicConfig as NodeConfig,
      hasToken: Boolean(config.gatewayToken),
    };
  });

  ipcMain.handle("node-device:save-config", (_event, payload: unknown) => {
    const parsed = nodeConfigSchema.safeParse(payload);
    if (!parsed.success) {
      return { ok: false, errors: formatZodErrors(parsed.error) };
    }

    const prev = loadStoredConfig();
    const next: StoredConfig = {
      ...parsed.data,
      aucobotWebUrl: parsed.data.aucobotWebUrl || undefined,
      aucobotApiUrl: parsed.data.aucobotApiUrl || undefined,
      gatewayToken: prev?.gatewayToken,
    };
    saveStoredConfig(next);

    if (typeof parsed.data.openAtLogin === "boolean") {
      app.setLoginItemSettings({
        openAtLogin: parsed.data.openAtLogin,
        openAsHidden: true,
      });
    }

    return { ok: true };
  });

  ipcMain.handle("node-device:connect", async (_event, payload: unknown) => {
    const parsed = connectPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      return { ok: false, errors: formatZodErrors(parsed.error) };
    }

    const data: ConnectPayload = parsed.data;
    const prev = loadStoredConfig();
    const gatewayToken = data.gatewayToken ?? prev?.gatewayToken;
    if (!gatewayToken || gatewayToken.trim().length < 8) {
      return {
        ok: false,
        errors: { gatewayToken: "Gateway token is required" },
      };
    }

    const endpoint = parseGatewayUrl(data.gatewayUrl);
    const port = toWsPortHint(endpoint);

    saveStoredConfig({
      gatewayUrl: data.gatewayUrl,
      displayName: data.displayName,
      aucobotWebUrl: data.aucobotWebUrl || undefined,
      aucobotApiUrl: data.aucobotApiUrl || undefined,
      openAtLogin: data.openAtLogin,
      gatewayToken,
    });

    logs = [];
    const result = await runner.start({
      host: endpoint.host,
      port,
      displayName: data.displayName,
      gatewayToken,
    });

    rebuildTrayMenu();
    if (!result.ok) {
      return result;
    }
    return { ok: true, message: "Node process started." };
  });

  ipcMain.handle("node-device:connect-with-invite", async (_event, payload: unknown) => {
    const parsed = connectWithInviteSchema.safeParse(payload);
    if (!parsed.success) {
      return { ok: false, errors: formatZodErrors(parsed.error) };
    }

    const data: ConnectWithInvitePayload = parsed.data;
    const redeemed = await redeemNodeInvite(data.apiBaseUrl, data.inviteCode);
    if (!redeemed.ok) {
      return { ok: false, message: redeemed.message };
    }

    const { gatewayUrl, gatewayToken, aucobotWebUrl } = redeemed.data;
    const endpoint = parseGatewayUrl(gatewayUrl);
    const port = toWsPortHint(endpoint);

    saveStoredConfig({
      gatewayUrl,
      gatewayToken,
      aucobotWebUrl,
      aucobotApiUrl: data.apiBaseUrl.replace(/\/$/, ""),
      displayName: data.displayName,
      openAtLogin: data.openAtLogin,
    });

    logs = [];
    pushLog("Invite redeemed — starting node…");
    const result = await runner.start({
      host: endpoint.host,
      port,
      displayName: data.displayName,
      gatewayToken,
    });

    rebuildTrayMenu();
    if (!result.ok) {
      return result;
    }
    return { ok: true, message: "Connected using pairing invite." };
  });

  ipcMain.handle("node-device:disconnect", () => {
    runner.stop();
    rebuildTrayMenu();
    return { ok: true };
  });

  ipcMain.handle("node-device:test-gateway", async (_event, payload: unknown) => {
    const parsed = nodeConfigSchema.pick({ gatewayUrl: true }).safeParse(payload);
    if (!parsed.success) {
      return { ok: false, errors: formatZodErrors(parsed.error) };
    }
    return testGatewayReachable(parsed.data.gatewayUrl);
  });

  ipcMain.handle("node-device:open-external", (_event, url: string) => {
    if (typeof url === "string" && /^https?:\/\//i.test(url)) {
      void shell.openExternal(url);
      return { ok: true };
    }
    return { ok: false, message: "Invalid URL" };
  });

  ipcMain.handle("node-device:clear-config", () => {
    clearStoredConfig();
    return { ok: true };
  });
}

declare global {
  namespace Electron {
    interface App {
      isQuitting?: boolean;
    }
  }
}

app.whenReady().then(() => {
  registerIpc();
  createTray();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow?.show();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  app.isQuitting = true;
  runner.stop();
});
