import { OSS_GATEWAY_DEV_URL } from "@/lib/runtime/oss-gateway";

/** HTTP base for shared OSS gateway (browser-safe). */
export function resolveOssGatewayHttpBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  return OSS_GATEWAY_DEV_URL;
}

/** Control UI path segment (OpenClaw `gateway.controlUi.basePath`). */
export function resolveControlUiPath(): string {
  const configured =
    process.env.NEXT_PUBLIC_OPENCLAW_CONTROL_UI_BASE_PATH?.trim();
  if (!configured || configured === "/") {
    return "";
  }
  return configured.startsWith("/") ? configured : `/${configured}`;
}

export function buildGatewayControlUiBaseUrl(httpBase: string): string {
  const base = httpBase.replace(/\/$/, "");
  const path = resolveControlUiPath();
  return path ? `${base}${path}` : base;
}

/**
 * One-shot bootstrap URL for OpenClaw Control UI (fragment token, stripped after load).
 * @see https://docs.openclaw.ai/web/control-ui
 */
export function buildGatewayControlUiUrl(
  httpBase: string,
  gatewayToken: string,
): string {
  const uiBase = buildGatewayControlUiBaseUrl(httpBase);
  const url = new URL(uiBase);
  url.hash = `token=${encodeURIComponent(gatewayToken)}`;
  return url.toString();
}
