import type { RuntimeMode } from './runtime-mode.js';

export type RuntimeStatus = 'creating' | 'running' | 'stopped' | 'error';

export type RuntimeHandle = {
  projectId: string;
  mode: RuntimeMode;
  gatewayToken?: string;
};

export type ProvisionOpts = {
  gatewayToken: string;
  /** Bootstrap workspace on disk before gateway health check. */
  onBootstrap: (projectId: string, gatewayToken: string) => Promise<void>;
};

export interface RuntimeProvisioner {
  /** OSS: bootstrap disk + wait for shared gateway. Cloud: spawn container. */
  provision(projectId: string, opts: ProvisionOpts): Promise<RuntimeHandle>;
  start(handle: RuntimeHandle): Promise<void>;
  stop(handle: RuntimeHandle): Promise<void>;
  destroy(handle: RuntimeHandle): Promise<void>;
  getStatus(handle: RuntimeHandle): Promise<RuntimeStatus>;
}
