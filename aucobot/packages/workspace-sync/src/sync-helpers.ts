import { readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { buildInitialOpenClawConfig } from './openclaw-config.js';

/** Preserve gateway token in config when missing after a partial merge. */
export function mergeGatewayBlockIfMissing(
  config: Record<string, unknown>,
  gatewayToken: string,
): void {
  const existing = config.gateway as Record<string, unknown> | undefined;
  const auth = existing?.auth as Record<string, unknown> | undefined;
  if (typeof auth?.token === 'string' && auth.token.length > 0) {
    return;
  }
  config.gateway = buildInitialOpenClawConfig({ gatewayToken }).gateway;
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
