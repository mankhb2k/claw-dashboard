import type { NodeDeviceApi } from "../preload/preload";

declare global {
  interface Window {
    nodeDevice: NodeDeviceApi;
  }
}

export {};
