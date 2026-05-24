export type GatewayEndpoint = {
  /** HTTP origin, e.g. http://127.0.0.1:18789 */
  httpBaseUrl: string;
  /** WebSocket origin, e.g. ws://127.0.0.1:18789 */
  wsBaseUrl: string;
  token: string;
};

/** OSS: optional per-project token in DB; env OPENCLAW_GATEWAY_TOKEN takes precedence. */
export type ProjectGatewayFields = {
  gatewayToken?: string | null;
};

export class GatewayConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GatewayConfigError';
  }
}

export interface GatewayEndpointResolver {
  resolve(project: ProjectGatewayFields): GatewayEndpoint;
}

/** Cloud billing / quota — noop in OSS; implemented in cloud/packages/quota. */
export interface PlanGuard {
  assertCanCreateProject(userId: string): Promise<void>;
}
