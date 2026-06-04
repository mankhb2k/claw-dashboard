/// <reference types="vite/client" />

import type { NodeDeviceApi } from "../preload/preload";

declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}

declare global {
  interface Window {
    nodeDevice: NodeDeviceApi;
  }
}

export {};
