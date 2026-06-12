import type { UsageSource, UsageStatus } from '@aucobot/database';
import type { PendingChatRun, RecordUsageInput } from './usage-record.types';
import {
  extractAgentSlugFromSessionKey,
  parseModelRef,
} from './parse-model-ref';

export type ParsedGatewayUsage = Omit<
  RecordUsageInput,
  'projectId' | 'userId'
> & {
  externalId: string;
};

type UsageNumbers = {
  inputTokens: number;
  outputTokens: number;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function asNonNegativeInt(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

function readUsageNumbers(raw: unknown): UsageNumbers {
  const o = asRecord(raw);
  if (!o) return { inputTokens: 0, outputTokens: 0 };

  const input =
    o.inputTokens ??
    o.input ??
    o.promptTokens ??
    o.prompt_tokens ??
    o.promptTokenCount;
  const output =
    o.outputTokens ??
    o.output ??
    o.completionTokens ??
    o.completion_tokens ??
    o.candidatesTokenCount;

  return {
    inputTokens: asNonNegativeInt(input),
    outputTokens: asNonNegativeInt(output),
  };
}

function readModelRef(payload: Record<string, unknown>): {
  providerId: string | null;
  modelId: string;
} {
  const explicitProvider =
    typeof payload.providerId === 'string'
      ? payload.providerId
      : typeof payload.provider === 'string'
        ? payload.provider
        : null;
  const explicitModel =
    typeof payload.modelId === 'string'
      ? payload.modelId
      : typeof payload.model === 'string'
        ? payload.model
        : null;

  if (explicitModel) {
    if (explicitModel.includes('/')) {
      return parseModelRef(explicitModel);
    }
    return {
      providerId: explicitProvider,
      modelId: explicitModel,
    };
  }

  return { providerId: explicitProvider, modelId: 'unknown' };
}

function mapChatState(state: string): UsageStatus | null {
  if (state === 'final') return 'SUCCESS';
  if (state === 'error') return 'FAILED';
  if (state === 'aborted') return 'CANCELLED';
  return null;
}

function inferSourceFromSessionKey(sessionKey: string): UsageSource {
  const key = sessionKey.trim().toLowerCase();
  if (key.startsWith('cron:')) return 'CRON';
  if (key.startsWith('channel:')) return 'CHANNEL';
  if (key.startsWith('heartbeat:')) return 'HEARTBEAT';
  return 'CHAT_UI';
}

function resolvePendingRun(
  payload: Record<string, unknown>,
  pendingRuns: Map<string, PendingChatRun>,
): PendingChatRun | undefined {
  const idempotencyKey =
    typeof payload.idempotencyKey === 'string' ? payload.idempotencyKey.trim() : '';
  if (idempotencyKey && pendingRuns.has(idempotencyKey)) {
    return pendingRuns.get(idempotencyKey);
  }

  const sessionKey = typeof payload.sessionKey === 'string' ? payload.sessionKey.trim() : '';
  if (!sessionKey) return undefined;

  for (const run of pendingRuns.values()) {
    if (run.sessionKey === sessionKey) {
      return run;
    }
  }
  return undefined;
}

function buildExternalId(
  prefix: string,
  parts: Array<string | undefined | null>,
): string | null {
  const values = parts.map((p) => p?.trim()).filter((p): p is string => Boolean(p));
  if (values.length === 0) return null;
  return `${prefix}:${values.join(':')}`;
}

function parseChatEvent(
  payload: Record<string, unknown>,
  pendingRuns: Map<string, PendingChatRun>,
): ParsedGatewayUsage | null {
  const state = typeof payload.state === 'string' ? payload.state : '';
  const status = mapChatState(state);
  if (!status) return null;

  const pending = resolvePendingRun(payload, pendingRuns);
  const sessionKey =
    typeof payload.sessionKey === 'string'
      ? payload.sessionKey
      : pending?.sessionKey ?? '';
  const idempotencyKey =
    typeof payload.idempotencyKey === 'string'
      ? payload.idempotencyKey
      : pending?.idempotencyKey;
  const externalId =
    buildExternalId('chat', [idempotencyKey]) ??
    buildExternalId('chat', [
      sessionKey,
      typeof payload.runId === 'string' ? payload.runId : String(Date.now()),
    ]);
  if (!externalId) return null;

  const usage = readUsageNumbers(payload.usage ?? payload);
  const model = readModelRef(payload);
  const startedAt = pending?.startedAt;
  const latencyMs =
    startedAt !== undefined ? Math.max(0, Date.now() - startedAt) : undefined;

  return {
    externalId,
    source: inferSourceFromSessionKey(sessionKey),
    status,
    modelId: model.modelId,
    providerId: model.providerId,
    agentSlug:
      pending?.agentSlug ??
      extractAgentSlugFromSessionKey(sessionKey) ??
      (typeof payload.agentSlug === 'string' ? payload.agentSlug : null),
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    latencyMs: latencyMs ?? null,
    metadata: {
      sessionKey: sessionKey || undefined,
      state,
      runId: typeof payload.runId === 'string' ? payload.runId : undefined,
    },
  };
}

function parseAgentEvent(payload: Record<string, unknown>): ParsedGatewayUsage | null {
  const phase = typeof payload.phase === 'string' ? payload.phase : '';
  const statusRaw = typeof payload.status === 'string' ? payload.status : phase;
  const status =
    statusRaw === 'error' || statusRaw === 'failed'
      ? 'FAILED'
      : statusRaw === 'aborted' || statusRaw === 'cancelled'
        ? 'CANCELLED'
        : statusRaw === 'done' || statusRaw === 'complete' || statusRaw === 'final'
          ? 'SUCCESS'
          : null;
  if (!status) return null;

  const runId =
    typeof payload.runId === 'string'
      ? payload.runId
      : typeof payload.id === 'string'
        ? payload.id
        : undefined;
  const jobId = typeof payload.jobId === 'string' ? payload.jobId : undefined;
  const sessionKey = typeof payload.sessionKey === 'string' ? payload.sessionKey : '';

  let externalId: string | null = null;
  let source: UsageSource = 'OTHER';

  if (jobId && runId) {
    externalId = buildExternalId('cron', [jobId, runId]);
    source = 'CRON';
  } else if (sessionKey.startsWith('heartbeat:')) {
    const agentSlug = extractAgentSlugFromSessionKey(sessionKey) ?? 'main';
    const minute = new Date().toISOString().slice(0, 16);
    externalId = buildExternalId('heartbeat', [agentSlug, minute]);
    source = 'HEARTBEAT';
  } else if (sessionKey.startsWith('channel:')) {
    const parts = sessionKey.split(':');
    externalId = buildExternalId('channel', [
      parts[1],
      runId ?? String(Date.now()),
    ]);
    source = 'CHANNEL';
  } else if (runId) {
    externalId = buildExternalId('agent', [runId]);
  }

  if (!externalId) return null;

  const usage = readUsageNumbers(payload.usage ?? payload);
  const model = readModelRef(payload);

  return {
    externalId,
    source,
    status,
    modelId: model.modelId,
    providerId: model.providerId,
    agentSlug:
      extractAgentSlugFromSessionKey(sessionKey) ??
      (typeof payload.agentSlug === 'string' ? payload.agentSlug : null),
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    latencyMs:
      typeof payload.latencyMs === 'number' ? asNonNegativeInt(payload.latencyMs) : null,
    metadata: {
      sessionKey: sessionKey || undefined,
      jobId,
      runId,
      phase: phase || undefined,
    },
  };
}

function parseUsageEvent(payload: Record<string, unknown>): ParsedGatewayUsage | null {
  const runId = typeof payload.runId === 'string' ? payload.runId : undefined;
  const externalId = buildExternalId('usage', [runId ?? String(Date.now())]);
  if (!externalId) return null;

  const usage = readUsageNumbers(payload.usage ?? payload);
  const model = readModelRef(payload);
  const sourceRaw = typeof payload.source === 'string' ? payload.source.toUpperCase() : '';
  const source: UsageSource =
    sourceRaw === 'CRON' ||
    sourceRaw === 'CHANNEL' ||
    sourceRaw === 'HEARTBEAT' ||
    sourceRaw === 'CHAT_UI' ||
    sourceRaw === 'API_KEY'
      ? (sourceRaw as UsageSource)
      : 'OTHER';

  return {
    externalId,
    source,
    status: 'SUCCESS',
    modelId: model.modelId,
    providerId: model.providerId,
    agentSlug: typeof payload.agentSlug === 'string' ? payload.agentSlug : null,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    latencyMs:
      typeof payload.latencyMs === 'number' ? asNonNegativeInt(payload.latencyMs) : null,
    metadata: {
      runId,
    },
  };
}

/** Parse a gateway WS event frame into a usage record, if terminal. */
export function parseGatewayUsageFrame(
  frame: Record<string, unknown>,
  pendingRuns: Map<string, PendingChatRun>,
): ParsedGatewayUsage | null {
  if (frame.type !== 'event') return null;
  const event = typeof frame.event === 'string' ? frame.event : '';
  const payload = asRecord(frame.payload);
  if (!payload) return null;

  if (event === 'chat') {
    return parseChatEvent(payload, pendingRuns);
  }
  if (event === 'agent' || event === 'cron') {
    return parseAgentEvent(payload);
  }
  if (event === 'usage' || event === 'model.usage') {
    return parseUsageEvent(payload);
  }

  return null;
}

export function consumePendingRun(
  parsed: ParsedGatewayUsage,
  pendingRuns: Map<string, PendingChatRun>,
): void {
  if (!parsed.externalId.startsWith('chat:')) return;
  const key = parsed.externalId.slice('chat:'.length);
  pendingRuns.delete(key);
}
