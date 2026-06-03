import { gatewayEndpointSchema, type GatewayEndpoint } from "../shared/schemas/node-config.schema";

function normalizeGatewayInput(raw: string): URL {
  const trimmed = raw.trim();
  if (/^wss?:\/\//i.test(trimmed)) {
    const httpish = trimmed.replace(/^wss/i, "https").replace(/^ws/i, "http");
    return new URL(httpish);
  }
  return new URL(trimmed);
}

export function parseGatewayUrl(gatewayUrl: string): GatewayEndpoint {
  const url = normalizeGatewayInput(gatewayUrl);
  const useTls = url.protocol === "https:";
  const port =
    url.port !== ""
      ? Number.parseInt(url.port, 10)
      : useTls
        ? 443
        : 80;

  const endpoint = {
    host: url.hostname,
    port,
    useTls,
    httpBase: `${useTls ? "https" : "http"}://${url.hostname}${url.port ? `:${url.port}` : ""}`,
  };

  return gatewayEndpointSchema.parse(endpoint);
}

export function toWsPortHint(endpoint: GatewayEndpoint): number {
  if (endpoint.port === 443 && endpoint.useTls) return 443;
  if (endpoint.port === 80 && !endpoint.useTls) return 80;
  return endpoint.port;
}
