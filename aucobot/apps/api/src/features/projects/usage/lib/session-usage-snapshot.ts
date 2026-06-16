import { readFile } from 'node:fs/promises';
import path from 'node:path';

export type SessionUsageRow = {
  inputTokens: number;
  outputTokens: number;
  modelProvider: string | null;
  model: string | null;
};

type SessionStore = Record<string, Record<string, unknown>>;

function asNonNegativeInt(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

function parseSessionRow(raw: Record<string, unknown> | undefined): SessionUsageRow | null {
  if (!raw) return null;
  return {
    inputTokens: asNonNegativeInt(raw.inputTokens),
    outputTokens: asNonNegativeInt(raw.outputTokens),
    modelProvider:
      typeof raw.modelProvider === 'string' && raw.modelProvider.trim()
        ? raw.modelProvider.trim()
        : null,
    model:
      typeof raw.model === 'string' && raw.model.trim() ? raw.model.trim() : null,
  };
}

/** Read cumulative session tokens/model from OpenClaw `agents/<slug>/sessions/sessions.json`. */
export async function readSessionUsageRow(
  projectDataDir: string,
  sessionKey: string,
): Promise<SessionUsageRow | null> {
  const key = sessionKey.trim();
  if (!key) return null;

  const parts = key.split(':').filter(Boolean);
  const agentSlug = parts[0] === 'agent' && parts[1] ? parts[1] : 'main';
  const storePath = path.join(
    projectDataDir,
    'agents',
    agentSlug,
    'sessions',
    'sessions.json',
  );

  try {
    const raw = await readFile(storePath, 'utf8');
    const store = JSON.parse(raw) as SessionStore;
    return parseSessionRow(store[key]);
  } catch {
    return null;
  }
}

export function computeSessionUsageDelta(
  previous: SessionUsageRow | null,
  current: SessionUsageRow,
): { inputTokens: number; outputTokens: number } {
  const prevInput = previous?.inputTokens ?? 0;
  const prevOutput = previous?.outputTokens ?? 0;
  const inputDelta = current.inputTokens - prevInput;
  const outputDelta = current.outputTokens - prevOutput;

  if (inputDelta < 0 || outputDelta < 0) {
    return {
      inputTokens: Math.max(0, current.inputTokens),
      outputTokens: Math.max(0, current.outputTokens),
    };
  }

  return {
    inputTokens: Math.max(0, inputDelta),
    outputTokens: Math.max(0, outputDelta),
  };
}
