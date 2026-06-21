import { parseModelRef } from './parse-model-ref';

import type { RecordUsageInput } from './usage-record.types';
import type { UsageSource, UsageStatus } from '@aucobot/shared';

type RpcUsageRecord = Omit<RecordUsageInput, 'projectId' | 'userId'> & {
  externalId: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null;
}

function readTokenPair(raw: unknown): {
  inputTokens: number;
  outputTokens: number;
} {
  const o = asRecord(raw);
  if (!o) return { inputTokens: 0, outputTokens: 0 };
  const input =
    o.inputTokens ?? o.input ?? o.prompt_tokens ?? o.promptTokenCount;
  const output =
    o.outputTokens ?? o.output ?? o.completion_tokens ?? o.candidatesTokenCount;
  return {
    inputTokens: typeof input === 'number' ? Math.max(0, Math.round(input)) : 0,
    outputTokens:
      typeof output === 'number' ? Math.max(0, Math.round(output)) : 0,
  };
}

/** Parse optional usage payload from gateway RPC responses (e.g. cron.run). */
export function parseCronRunRpcUsage(
  jobId: string,
  response: unknown,
): RpcUsageRecord | null {
  const root = asRecord(response);
  if (!root) return null;

  const runId =
    typeof root.runId === 'string'
      ? root.runId
      : typeof root.id === 'string'
        ? root.id
        : null;
  if (!runId) return null;

  const usage = readTokenPair(root.usage ?? root);
  const model = parseModelRef(
    typeof root.model === 'string'
      ? root.model
      : typeof root.modelId === 'string'
        ? root.modelId
        : 'unknown',
  );

  const statusRaw = typeof root.status === 'string' ? root.status : 'success';
  const status: UsageStatus =
    statusRaw === 'error' || statusRaw === 'failed'
      ? 'FAILED'
      : statusRaw === 'cancelled' || statusRaw === 'aborted'
        ? 'CANCELLED'
        : 'SUCCESS';

  return {
    externalId: `cron:${jobId}:${runId}`,
    source: 'CRON' as UsageSource,
    status,
    modelId: model.modelId,
    providerId: model.providerId,
    agentSlug: typeof root.agentId === 'string' ? root.agentId : null,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    latencyMs:
      typeof root.latencyMs === 'number' ? Math.round(root.latencyMs) : null,
    metadata: {
      jobId,
      runId,
      agentId: typeof root.agentId === 'string' ? root.agentId : undefined,
    },
  };
}
