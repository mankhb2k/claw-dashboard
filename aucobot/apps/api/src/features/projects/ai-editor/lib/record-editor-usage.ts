import { UsageSource, UsageStatus } from '@aucobot/database';
import type { ModelUsageRecorderService } from '../../usage/services/model-usage-recorder/model-usage-recorder.service';

type EditorUsageBase = {
  projectId: string;
  userId: string;
  externalId: string;
  providerId: string;
  modelId: string;
  agentSlug?: string | null;
};

export function recordEditorUsageSuccess(
  recorder: ModelUsageRecorderService,
  base: EditorUsageBase,
  tokens: { inputTokens: number; outputTokens: number; latencyMs: number },
  metadata: Record<string, unknown>,
): void {
  recorder.recordFireAndForget({
    projectId: base.projectId,
    userId: base.userId,
    source: UsageSource.OTHER,
    status: UsageStatus.SUCCESS,
    externalId: base.externalId,
    providerId: base.providerId,
    modelId: base.modelId,
    agentSlug: base.agentSlug ?? null,
    inputTokens: tokens.inputTokens,
    outputTokens: tokens.outputTokens,
    latencyMs: tokens.latencyMs,
    metadata,
  });
}

export function recordEditorUsageFailure(
  recorder: ModelUsageRecorderService,
  base: EditorUsageBase,
  error: unknown,
  metadata: Record<string, unknown>,
): void {
  recorder.recordFireAndForget({
    projectId: base.projectId,
    userId: base.userId,
    source: UsageSource.OTHER,
    status: UsageStatus.FAILED,
    externalId: base.externalId,
    providerId: base.providerId,
    modelId: base.modelId,
    agentSlug: base.agentSlug ?? null,
    inputTokens: 0,
    outputTokens: 0,
    metadata: {
      ...metadata,
      error: error instanceof Error ? error.message : String(error),
    },
  });
}
