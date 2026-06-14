import { readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { buildInitialOpenClawConfig } from './openclaw-config.js';

/** @deprecated Prefer {@link syncGatewayAuthToken} — only fills when token is absent. */
export function mergeGatewayBlockIfMissing(
  config: Record<string, unknown>,
  gatewayToken: string,
): void {
  const existing = config.gateway as Record<string, unknown> | undefined;
  const auth = existing?.auth as Record<string, unknown> | undefined;
  if (typeof auth?.token === 'string' && auth.token.length > 0) {
    return;
  }
  syncGatewayAuthToken(config, gatewayToken);
}

/**
 * OSS: align `gateway.auth.token` on disk with `OPENCLAW_GATEWAY_TOKEN` (or DB fallback).
 * Preserves other gateway fields (bind, port, channels, …).
 */
export function syncGatewayAuthToken(
  config: Record<string, unknown>,
  gatewayToken: string,
): void {
  const token = gatewayToken.trim();
  if (!token) {
    return;
  }

  const built = buildInitialOpenClawConfig({ gatewayToken: token });
  const existing = config.gateway as Record<string, unknown> | undefined;

  if (!existing?.mode) {
    config.gateway = built.gateway;
    return;
  }

  const controlUi = {
    ...(typeof existing.controlUi === 'object' && existing.controlUi !== null
      ? (existing.controlUi as Record<string, unknown>)
      : {}),
    ...built.gateway.controlUi,
  };

  config.gateway = {
    ...existing,
    mode: existing.mode ?? built.gateway.mode,
    bind: existing.bind ?? built.gateway.bind,
    port: typeof existing.port === 'number' ? existing.port : built.gateway.port,
    auth: built.gateway.auth,
    controlUi,
  };
}

export function gatewayAuthTokenFromConfig(
  config: Record<string, unknown>,
): string | null {
  const auth = (config.gateway as Record<string, unknown> | undefined)?.auth as
    | Record<string, unknown>
    | undefined;
  return typeof auth?.token === 'string' && auth.token.length > 0 ? auth.token : null;
}

/** Drop stale Codex/OpenAI discovery cache when primary model is not OpenAI. */
export async function cleanupStaleMainAgentModels(
  dataDir: string,
  config: Record<string, unknown>,
): Promise<void> {
  const agents = config.agents as Record<string, unknown> | undefined;
  const defaults = agents?.defaults as Record<string, unknown> | undefined;
  const model = defaults?.model as Record<string, unknown> | undefined;
  const primary =
    typeof model?.primary === 'string' ? model.primary.trim().toLowerCase() : '';
  if (!primary || primary.startsWith('openai/')) {
    return;
  }

  const modelsPath = path.join(dataDir, 'agents', 'main', 'agent', 'models.json');
  try {
    const raw = await readFile(modelsPath, 'utf8');
    const parsed = JSON.parse(raw) as { providers?: Record<string, unknown> };
    const providers = parsed.providers ?? {};
    const keys = Object.keys(providers);
    const onlyOpenAiDiscovery =
      keys.length > 0 && keys.every((k) => k === 'codex' || k === 'openai');
    if (onlyOpenAiDiscovery) {
      await unlink(modelsPath);
    }
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException)?.code !== 'ENOENT') {
      throw err;
    }
  }
}
