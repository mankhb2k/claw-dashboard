import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../../../../core/database/prisma.service';
import { computeCostUsd } from '../../lib/compute-cost-usd';
import { findModelPricing } from '../../lib/model-pricing.catalog';
import {
  consumePendingRun,
  mergeSessionEnrichment,
  parseGatewayUsageFrame,
} from '../../lib/parse-gateway-usage';
import {
  computeSessionUsageDelta,
  readSessionUsageRow,
  type SessionUsageRow,
} from '../../lib/session-usage-snapshot';
import { Prisma } from '@aucobot/database';

import type { ParsedGatewayUsage } from '../../lib/parse-gateway-usage';
import type {
  GatewayTapContext,
  RecordUsageInput,
} from '../../lib/usage-record.types';

const SESSION_ENRICH_DELAY_MS = 250;

function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
  );
}

function sessionTrackerKey(projectId: string, sessionKey: string): string {
  return `${projectId}:${sessionKey}`;
}

@Injectable()
export class ModelUsageRecorderService {
  private readonly log = new Logger(ModelUsageRecorderService.name);
  private readonly sessionSnapshots = new Map<string, SessionUsageRow>();

  constructor(private readonly prisma: PrismaService) {}

  async record(input: RecordUsageInput): Promise<void> {
    const inputTokens = input.inputTokens ?? 0;
    const outputTokens = input.outputTokens ?? 0;
    const costUsd = this.resolveCostUsd(
      input.providerId,
      input.modelId,
      inputTokens,
      outputTokens,
    );

    try {
      await this.prisma.modelUsageEvent.create({
        data: {
          projectId: input.projectId,
          userId: input.userId,
          source: input.source,
          status: input.status,
          modelId: input.modelId,
          providerId: input.providerId ?? null,
          agentSlug: input.agentSlug ?? null,
          inputTokens,
          outputTokens,
          costUsd,
          latencyMs: input.latencyMs ?? null,
          externalId: input.externalId ?? null,
          metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        return;
      }
      throw err;
    }
  }

  recordFireAndForget(input: RecordUsageInput): void {
    void this.record(input).catch((err) => {
      const message = err instanceof Error ? err.message : String(err);
      this.log.warn(`Failed to record model usage: ${message}`);
    });
  }

  tapGatewayFrame(ctx: GatewayTapContext): void {
    const parsed = parseGatewayUsageFrame(ctx.frame, ctx.pendingRuns);
    if (!parsed) {
      return;
    }

    if (process.env.LOG_LEVEL === 'debug' && ctx.frame.event === 'chat') {
      this.log.debug(
        `Gateway chat event: ${JSON.stringify(ctx.frame.payload ?? {}).slice(0, 500)}`,
      );
    }

    consumePendingRun(parsed, ctx.pendingRuns);

    if (parsed.needsSessionEnrichment && ctx.projectDataDir) {
      this.recordWithSessionEnrichment(ctx, parsed);
      return;
    }

    this.recordFireAndForget({
      projectId: ctx.projectId,
      userId: ctx.userId,
      ...parsed,
    });
  }

  private recordWithSessionEnrichment(
    ctx: GatewayTapContext,
    parsed: ParsedGatewayUsage,
  ): void {
    const sessionKey =
      typeof parsed.metadata?.sessionKey === 'string'
        ? parsed.metadata.sessionKey
        : '';
    if (!sessionKey || !ctx.projectDataDir) {
      this.recordFireAndForget({
        projectId: ctx.projectId,
        userId: ctx.userId,
        ...parsed,
      });
      return;
    }

    const trackerKey = sessionTrackerKey(ctx.projectId, sessionKey);
    const previous = this.sessionSnapshots.get(trackerKey) ?? null;

    setTimeout(() => {
      void this.enrichAndRecord(ctx, parsed, trackerKey, previous, sessionKey);
    }, SESSION_ENRICH_DELAY_MS);
  }

  private async enrichAndRecord(
    ctx: GatewayTapContext,
    parsed: ParsedGatewayUsage,
    trackerKey: string,
    previous: SessionUsageRow | null,
    sessionKey: string,
  ): Promise<void> {
    if (!ctx.projectDataDir) return;

    try {
      const current = await readSessionUsageRow(ctx.projectDataDir, sessionKey);
      if (!current) {
        this.recordFireAndForget({
          projectId: ctx.projectId,
          userId: ctx.userId,
          ...parsed,
        });
        return;
      }

      const delta = computeSessionUsageDelta(previous, current);
      this.sessionSnapshots.set(trackerKey, current);

      const enriched = mergeSessionEnrichment(parsed, current, delta);
      this.recordFireAndForget({
        projectId: ctx.projectId,
        userId: ctx.userId,
        ...enriched,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log.warn(`Session usage enrichment failed: ${message}`);
      this.recordFireAndForget({
        projectId: ctx.projectId,
        userId: ctx.userId,
        ...parsed,
      });
    }
  }

  private resolveCostUsd(
    providerId: string | null | undefined,
    modelId: string,
    inputTokens: number,
    outputTokens: number,
  ): string {
    const provider = providerId?.trim();
    if (!provider) {
      return '0';
    }

    const model = modelId.trim();
    let pricing = findModelPricing(provider, model);
    if (!pricing) {
      const slash = model.indexOf('/');
      if (slash > 0) {
        pricing = findModelPricing(provider, model.slice(slash + 1));
      }
    }

    return computeCostUsd(inputTokens, outputTokens, pricing);
  }
}
