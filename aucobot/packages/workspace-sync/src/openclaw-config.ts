/** Shape ghi vào openclaw.json trên volume project (JSON thuần). */
export type OpenClawProjectConfig = {
  gateway: {
    mode: 'local';
    bind: 'lan';
    port: number;
    auth: {
      mode: 'token';
      token: string;
    };
    controlUi?: {
      allowInsecureAuth?: boolean;
    };
  };
  /** Provider API keys — gateway reload khi file đổi. */
  env?: Record<string, string>;
  agents: {
    defaults: {
      workspace: string;
      model?: {
        primary?: string;
      };
    };
  };
};

const CONTAINER_STATE_DIR = '/home/node/.openclaw';
const CONTAINER_WORKSPACE_DIR = `${CONTAINER_STATE_DIR}/workspace`;

export function buildInitialOpenClawConfig(params: {
  gatewayToken: string;
  gatewayPort?: number;
}): OpenClawProjectConfig {
  return {
    gateway: {
      mode: 'local',
      bind: 'lan',
      port: params.gatewayPort ?? 18789,
      auth: {
        mode: 'token',
        token: params.gatewayToken,
      },
      controlUi: {
        allowInsecureAuth: true,
      },
    },
    env: {},
    agents: {
      defaults: {
        workspace: CONTAINER_WORKSPACE_DIR,
      },
    },
  };
}

export { CONTAINER_STATE_DIR, CONTAINER_WORKSPACE_DIR };
