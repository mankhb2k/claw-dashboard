import {
  GatewayConfigError,
  type GatewayEndpoint,
  type GatewayEndpointResolver,
  type ProjectGatewayFields,
} from '@claw-dashboard/runtime-contracts';

export function httpBaseToWsBase(httpBaseUrl: string): string {
  const url = new URL(httpBaseUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.origin;
}

function normalizeHttpBaseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new GatewayConfigError('OPENCLAW_GATEWAY_URL is not configured');
  }
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  const url = new URL(withScheme);
  return url.origin;
}

export function resolveOssGatewayHttpBase(): string {
  return normalizeHttpBaseUrl(process.env.OPENCLAW_GATEWAY_URL ?? 'http://127.0.0.1:18789');
}

export function resolveOssGatewayToken(fallback?: string | null): string {
  const fromEnv = process.env.OPENCLAW_GATEWAY_TOKEN?.trim();
  if (fromEnv) return fromEnv;
  const fromProject = fallback?.trim();
  if (fromProject) return fromProject;
  throw new GatewayConfigError(
    'Gateway token is not configured — set OPENCLAW_GATEWAY_TOKEN or create a project to generate one',
  );
}

export function resolveOssGatewayEndpoint(
  project?: Pick<ProjectGatewayFields, 'gatewayToken'>,
): GatewayEndpoint {
  const httpBaseUrl = resolveOssGatewayHttpBase();
  return {
    httpBaseUrl,
    wsBaseUrl: httpBaseToWsBase(httpBaseUrl),
    token: resolveOssGatewayToken(project?.gatewayToken),
  };
}

export const ossGatewayEndpointResolver: GatewayEndpointResolver = {
  resolve(project) {
    return resolveOssGatewayEndpoint(project);
  },
};
