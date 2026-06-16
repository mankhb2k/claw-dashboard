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
  /** True when chat.final arrived without usage/model and needs session-store enrichment. */
  needsSessionEnrichment?: boolean;
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

export function readUsageNumbers(raw: unknown): UsageNumbers {
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
        : typeof payload.modelProvider === 'string'
          ? payload.modelProvider
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
    if (explicitProvider) {
      const providerId =
        explicitProvider === 'google'
          ? 'gemini'
          : explicitProvider === 'openai'
            ? 'openai'
            : explicitProvider;
      return { providerId, modelId: `${explicitProvider}/${explicitModel}` };
    }
    return {
      providerId: explicitProvider,
      modelId: explicitModel,
    };
  }

  return { providerId: explicitProvider, modelId: 'unknown' };
}

function readUsageAndModelFromPayload(payload: Record<string, unknown>): {
  usage: UsageNumbers;
  model: { providerId: string | null; modelId: string };
} {
  const message = asRecord(payload.message);
  const usageSources = [
    payload.usage,
    payload.lastCallUsage,
    message?.usage,
    payload,
  ];

  let usage: UsageNumbers = { inputTokens: 0, outputTokens: 0 };
  for (const source of usageSources) {
    const candidate = readUsageNumbers(source);
    if (candidate.inputTokens > 0 || candidate.outputTokens > 0) {
      usage = candidate;
      break;
    }
  }

  const modelSources = [payload, message ?? {}];
  let model = readModelRef(payload);
  if (model.modelId === 'unknown') {
    for (const source of modelSources) {
      const candidate = readModelRef(source);
      if (candidate.modelId !== 'unknown') {
        model = candidate;
        break;
      }
    }
  }

  return { usage, model };
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

  const runId = typeof payload.runId === 'string' ? payload.runId.trim() : '';
  if (runId && pendingRuns.has(runId)) {
    return pendingRuns.get(runId);
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

/** Stable per-run id shared by chat.final, lifecycle usage, and proxy/subscriber taps. */
export function buildRunExternalId(
  runId: string | undefined | null,
  idempotencyKey?: string | null,
): string | null {
  const run = runId?.trim() || idempotencyKey?.trim();
  return run ? buildExternalId('run', [run]) : null;
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
  const runId =
    typeof payload.runId === 'string'
      ? payload.runId
      : pending?.idempotencyKey;
  const idempotencyKey =
    typeof payload.idempotencyKey === 'string'
      ? payload.idempotencyKey
      : pending?.idempotencyKey;
  const externalId =
    buildRunExternalId(runId, idempotencyKey) ??
    buildExternalId('chat', [idempotencyKey]) ??
    buildExternalId('chat', [sessionKey, runId ?? String(Date.now())]);
  if (!externalId) return null;

  const { usage, model } = readUsageAndModelFromPayload(payload);
  const startedAt = pending?.startedAt;
  const latencyMs =
    startedAt !== undefined ? Math.max(0, Date.now() - startedAt) : undefined;
  const needsSessionEnrichment =
    status === 'SUCCESS' &&
    usage.inputTokens === 0 &&
    usage.outputTokens === 0 &&
    model.modelId === 'unknown';

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
    needsSessionEnrichment,
    metadata: {
      sessionKey: sessionKey || undefined,
      state,
      runId: typeof payload.runId === 'string' ? payload.runId : undefined,
      idempotencyKey: idempotencyKey || undefined,
    },
  };
}

function parseAgentLifecycleUsage(
  payload: Record<string, unknown>,
  data: Record<string, unknown>,
): ParsedGatewayUsage | null {
  const runId = typeof payload.runId === 'string' ? payload.runId.trim() : '';
  const externalId = buildRunExternalId(runId);
  if (!externalId) return null;

  const usage = readUsageNumbers(
    data.usage ?? data.lastCallUsage ?? data,
  );
  const model = readModelRef({
    provider: data.provider,
    model: data.model,
    modelProvider: data.modelProvider,
    ...data,
  });
  const sessionKey =
    typeof payload.sessionKey === 'string' ? payload.sessionKey : '';

  return {
    externalId,
    source: inferSourceFromSessionKey(sessionKey),
    status: 'SUCCESS',
    modelId: model.modelId,
    providerId: model.providerId,
    agentSlug:
      extractAgentSlugFromSessionKey(sessionKey) ??
      (typeof payload.agentSlug === 'string' ? payload.agentSlug : null),
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    latencyMs:
      typeof data.durationMs === 'number'
        ? asNonNegativeInt(data.durationMs)
        : null,
    metadata: {
      sessionKey: sessionKey || undefined,
      runId: runId || undefined,
      phase: 'usage',
    },
  };
}

function parseAgentEvent(payload: Record<string, unknown>): ParsedGatewayUsage | null {
  const stream = typeof payload.stream === 'string' ? payload.stream : '';
  const data = asRecord(payload.data);
  if (stream === 'lifecycle' && data?.phase === 'usage') {
    return parseAgentLifecycleUsage(payload, data);
  }

  const phase = typeof payload.phase === 'string' ? payload.phase : '';
  const statusRaw = typeof payload.status === 'string' ? payload.status : phase;
  const dataPhase = typeof data?.phase === 'string' ? data.phase : '';
  const effectivePhase = statusRaw || dataPhase;
  const status =
    effectivePhase === 'error' || effectivePhase === 'failed'
      ? 'FAILED'
      : effectivePhase === 'aborted' || effectivePhase === 'cancelled'
        ? 'CANCELLED'
        : effectivePhase === 'done' ||
            effectivePhase === 'complete' ||
            effectivePhase === 'final' ||
            effectivePhase === 'end'
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

  let externalId: string | null = buildRunExternalId(runId);
  let source: UsageSource = 'OTHER';

  if (!externalId) {
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
  } else if (sessionKey.startsWith('cron:') || jobId) {
    source = 'CRON';
  } else if (sessionKey.startsWith('heartbeat:')) {
    source = 'HEARTBEAT';
  } else if (sessionKey.startsWith('channel:')) {
    source = 'CHANNEL';
  } else if (sessionKey) {
    source = inferSourceFromSessionKey(sessionKey);
  }

  if (!externalId) return null;

  const usage = readUsageNumbers(payload.usage ?? data?.usage ?? payload);
  const model = readModelRef({ ...payload, ...(data ?? {}) });

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
      typeof payload.latencyMs === 'number'
        ? asNonNegativeInt(payload.latencyMs)
        : typeof data?.durationMs === 'number'
          ? asNonNegativeInt(data.durationMs)
          : null,
    metadata: {
      sessionKey: sessionKey || undefined,
      jobId,
      runId,
      phase: effectivePhase || undefined,
    },
  };
}

function parseUsageEvent(payload: Record<string, unknown>): ParsedGatewayUsage | null {
  const runId = typeof payload.runId === 'string' ? payload.runId : undefined;
  const externalId =
    buildRunExternalId(runId) ?? buildExternalId('usage', [runId ?? String(Date.now())]);
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
  const externalId = parsed.externalId;
  const keys = new Set<string>();
  if (externalId.startsWith('run:')) {
    keys.add(externalId.slice('run:'.length));
  }
  if (externalId.startsWith('chat:')) {
    keys.add(externalId.slice('chat:'.length));
  }
  const meta = parsed.metadata ?? {};
  if (typeof meta.idempotencyKey === 'string') keys.add(meta.idempotencyKey);
  if (typeof meta.runId === 'string') keys.add(meta.runId);

  for (const key of keys) {
    pendingRuns.delete(key);
  }
}

export function mergeSessionEnrichment(
  parsed: ParsedGatewayUsage,
  row: {
    inputTokens: number;
    outputTokens: number;
    modelProvider: string | null;
    model: string | null;
  },
  delta: { inputTokens: number; outputTokens: number },
): ParsedGatewayUsage {
  const model =
    parsed.modelId !== 'unknown'
      ? { providerId: parsed.providerId, modelId: parsed.modelId }
      : row.model
        ? readModelRef({
            modelProvider: row.modelProvider ?? undefined,
            model: row.model,
          })
        : { providerId: parsed.providerId, modelId: parsed.modelId };

  const inputTokens = parsed.inputTokens ?? 0;
  const outputTokens = parsed.outputTokens ?? 0;

  return {
    ...parsed,
    modelId: model.modelId,
    providerId: model.providerId,
    inputTokens:
      inputTokens > 0 || outputTokens > 0 ? inputTokens : delta.inputTokens,
    outputTokens:
      inputTokens > 0 || outputTokens > 0 ? outputTokens : delta.outputTokens,
    needsSessionEnrichment: false,
    metadata: {
      ...parsed.metadata,
      enrichedFromSessionStore: true,
    },
  };
}
