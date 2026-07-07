import type { UsageSource, UsageStatus } from '@claw-dashboard/shared';

export type RecordUsageInput = {
  projectId: string;
  userId: string;
  source: UsageSource;
  modelId: string;
  status: UsageStatus;
  inputTokens?: number;
  outputTokens?: number;
  providerId?: string | null;
  agentSlug?: string | null;
  latencyMs?: number | null;
  externalId?: string | null;
  metadata?: Record<string, unknown>;
};

export type ModelPricingRow = {
  inputPer1MUsd: { toString(): string } | number | string;
  outputPer1MUsd: { toString(): string } | number | string;
};

export type PendingChatRun = {
  startedAt: number;
  sessionKey: string;
  agentSlug?: string;
  idempotencyKey: string;
};

export type GatewayTapContext = {
  projectId: string;
  userId: string;
  frame: Record<string, unknown>;
  pendingRuns: Map<string, PendingChatRun>;
  /** Host project data dir for OpenClaw session-store enrichment. */
  projectDataDir?: string;
};
