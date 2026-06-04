import { contextBridge, ipcRenderer } from "electron";
import type {
  ConnectPayload,
  ConnectWithInvitePayload,
  NodeConfig,
  NodeConnectionState,
} from "../shared/schemas/node-config.schema";

export type NodeDeviceMeta = {
  safeStorage: boolean;
  isDev: boolean;
  logs: string[];
  state: NodeConnectionState;
};

export type GetConfigResponse = {
  config: NodeConfig | null;
  hasToken?: boolean;
};

export type IpcOk = {
  ok: boolean;
  errors?: Record<string, string>;
  message?: string;
};

export type StateEvent = {
  state: NodeConnectionState;
  detail?: string;
};

const api = {
  getMeta: (): Promise<NodeDeviceMeta> => ipcRenderer.invoke("node-device:get-meta"),
  getConfig: (): Promise<GetConfigResponse> => ipcRenderer.invoke("node-device:get-config"),
  saveConfig: (config: NodeConfig): Promise<IpcOk> =>
    ipcRenderer.invoke("node-device:save-config", config),
  connect: (payload: ConnectPayload): Promise<IpcOk> =>
    ipcRenderer.invoke("node-device:connect", payload),
  connectWithInvite: (payload: ConnectWithInvitePayload): Promise<IpcOk> =>
    ipcRenderer.invoke("node-device:connect-with-invite", payload),
  reconnect: (): Promise<IpcOk> => ipcRenderer.invoke("node-device:reconnect"),
  disconnect: (): Promise<IpcOk> => ipcRenderer.invoke("node-device:disconnect"),
  testGateway: (payload: Pick<NodeConfig, "gatewayUrl">): Promise<IpcOk> =>
    ipcRenderer.invoke("node-device:test-gateway", payload),
  openExternal: (url: string): Promise<IpcOk> =>
    ipcRenderer.invoke("node-device:open-external", url),
  clearConfig: (): Promise<IpcOk> => ipcRenderer.invoke("node-device:clear-config"),
  onLog: (handler: (line: string) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, line: string) => handler(line);
    ipcRenderer.on("node-device:log", listener);
    return () => ipcRenderer.removeListener("node-device:log", listener);
  },
  onState: (handler: (event: StateEvent) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: StateEvent) =>
      handler(payload);
    ipcRenderer.on("node-device:state", listener);
    return () => ipcRenderer.removeListener("node-device:state", listener);
  },
};

contextBridge.exposeInMainWorld("nodeDevice", api);

export type NodeDeviceApi = typeof api;
