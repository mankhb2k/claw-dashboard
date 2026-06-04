import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  nativeImage,
  screen,
  shell,
  Tray,
} from "electron";
import path from "node:path";
import { formatZodErrors } from "../shared/parse";
import {
  connectWithInviteSchema,
  nodeConfigSchema,
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
const isHeadless = process.env.NODE_DEVICE_HEADLESS === "1";

/** Main (~32rem) + settings sidebar (28rem) + shell padding */
const WINDOW_DEFAULT_WIDTH = 1080;
const WINDOW_MIN_WIDTH = 720;
const WINDOW_MIN_HEIGHT = 720;

function resolveDefaultWindowBounds(): { width: number; height: number } {
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;
  const width = Math.min(
    Math.max(WINDOW_DEFAULT_WIDTH, WINDOW_MIN_WIDTH),
    Math.max(screenW - 48, WINDOW_MIN_WIDTH),
  );
  return {
    width,
    height: Math.min(Math.max(Math.round(screenH * 0.88), WINDOW_MIN_HEIGHT), 920),
  };
}

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
  if (isHeadless) {
    console.log(`[node-device:log] ${line}`);
  }
  mainWindow?.webContents.send("node-device:log", line);
}

function broadcastState(state: NodeConnectionState, detail?: string): void {
  if (isHeadless) {
    console.log(`[node-device:state] ${state}${detail ? `: ${detail}` : ""}`);
  }
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
  const { width, height } = resolveDefaultWindowBounds();

  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: WINDOW_MIN_WIDTH,
    minHeight: WINDOW_MIN_HEIGHT,
    show: false,
    autoHideMenuBar: true,
    center: true,
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
    if (!isHeadless) {
      mainWindow?.show();
    }
  });

  mainWindow.on("close", (event) => {
    if (isHeadless) {
      return;
    }
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

function isInviteAlreadyUsedMessage(message: string): boolean {
  return /already used|đã được sử dụng|đã dùng/i.test(message);
}

type SavedGatewaySession = StoredConfig & {
  gatewayUrl: string;
  gatewayToken: string;
};

async function startNodeFromStored(
  stored: SavedGatewaySession,
  displayName?: string,
): Promise<{ ok: boolean; message?: string }> {
  const endpoint = parseGatewayUrl(stored.gatewayUrl);
  const port = toWsPortHint(endpoint);
  return runner.start({
    host: endpoint.host,
    port,
    displayName: displayName ?? stored.displayName,
    gatewayToken: stored.gatewayToken,
    gatewayUrl: stored.gatewayUrl,
  });
}

async function performConnectWithInvite(
  data: ConnectWithInvitePayload,
): Promise<{ ok: boolean; message?: string; errors?: Record<string, string> }> {
  const webUrl = data.webBaseUrl.replace(/\/$/, "");
  let gatewayUrl: string;
  let gatewayToken: string;
  let aucobotWebUrl: string;

  const redeemed = await redeemNodeInvite(data.webBaseUrl, data.inviteCode);
  if (!redeemed.ok) {
    if (isInviteAlreadyUsedMessage(redeemed.message ?? "")) {
      const stored = loadStoredConfig();
      if (!stored?.gatewayUrl || !stored.gatewayToken) {
        return {
          ok: false,
          message: "Mã invite đã được dùng. Tạo mã mới trên Companion Nodes.",
        };
      }
      gatewayUrl = stored.gatewayUrl;
      gatewayToken = stored.gatewayToken;
      aucobotWebUrl = stored.aucobotWebUrl ?? webUrl;
      pushLog("Mã invite đã redeem — tiếp tục kết nối bằng phiên đã lưu…");
    } else {
      return { ok: false, message: redeemed.message };
    }
  } else {
    ({ gatewayUrl, gatewayToken, aucobotWebUrl } = redeemed.data);
    pushLog("Invite redeemed — starting node…");
  }

  saveStoredConfig({
    gatewayUrl,
    gatewayToken,
    aucobotWebUrl: aucobotWebUrl || webUrl,
    displayName: data.displayName,
    openAtLogin: data.openAtLogin,
    permissions: data.permissions,
  });

  if (redeemed.ok) {
    logs = [];
  }
  const result = await startNodeFromStored(
    {
      gatewayUrl,
      gatewayToken,
      aucobotWebUrl: aucobotWebUrl || webUrl,
      displayName: data.displayName,
      openAtLogin: data.openAtLogin,
      permissions: data.permissions,
    } satisfies SavedGatewaySession,
    data.displayName,
  );

  rebuildTrayMenu();
  if (!result.ok) {
    return result;
  }
  return { ok: true, message: "Đang kết nối gateway…" };
}

function watchExitOnConnected(): void {
  if (process.env.NODE_DEVICE_EXIT_ON_CONNECTED !== "1") {
    return;
  }

  const timer = setInterval(() => {
    if (runner.getState() !== "connected") {
      return;
    }
    clearInterval(timer);
    console.log("[node-device] connected — exiting (NODE_DEVICE_EXIT_ON_CONNECTED=1)");
    setTimeout(() => {
      app.isQuitting = true;
      runner.stop();
      app.quit();
    }, 1500);
  }, 500);
}

async function runHeadlessAutoConnect(): Promise<void> {
  const invite = process.env.NODE_DEVICE_AUTO_INVITE?.trim();
  if (!invite) {
    return;
  }

  const payload: ConnectWithInvitePayload = {
    webBaseUrl: process.env.NODE_DEVICE_WEB_URL?.trim() || "http://localhost:3000",
    inviteCode: invite,
    displayName: process.env.NODE_DEVICE_AUTO_DISPLAY_NAME?.trim() || "headless-test",
    openAtLogin: false,
  };

  const parsed = connectWithInviteSchema.safeParse(payload);
  if (!parsed.success) {
    console.error("[node-device] invalid auto-connect env:", formatZodErrors(parsed.error));
    return;
  }

  console.log("[node-device] auto-connect via invite…");
  const result = await performConnectWithInvite(parsed.data);
  console.log(`[node-device] connect: ${result.ok ? "ok" : "failed"}${result.message ? ` — ${result.message}` : ""}`);
  watchExitOnConnected();
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
      hasSavedSession: Boolean(config.gatewayUrl && config.gatewayToken),
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

  ipcMain.handle("node-device:connect-with-invite", async (_event, payload: unknown) => {
    const parsed = connectWithInviteSchema.safeParse(payload);
    if (!parsed.success) {
      return { ok: false, errors: formatZodErrors(parsed.error) };
    }
    return performConnectWithInvite(parsed.data);
  });

  ipcMain.handle("node-device:reconnect", async () => {
    const stored = loadStoredConfig();
    if (!stored?.gatewayUrl || !stored.gatewayToken) {
      return { ok: false, message: "Chưa có cấu hình. Hãy kết nối bằng mã invite trước." };
    }

    logs = [];
    pushLog("Reconnecting with saved credentials…");
    const result = await startNodeFromStored(stored as SavedGatewaySession);

    rebuildTrayMenu();
    if (!result.ok) {
      return result;
    }
    return { ok: true, message: "Đang kết nối gateway…" };
  });

  ipcMain.handle("node-device:disconnect", () => {
    runner.stop();
    rebuildTrayMenu();
    return { ok: true };
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
  if (!isHeadless) {
    createTray();
  }
  if (!isHeadless) {
    createWindow();
  }
  void runHeadlessAutoConnect();

  app.on("activate", () => {
    if (isHeadless) {
      return;
    }
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
