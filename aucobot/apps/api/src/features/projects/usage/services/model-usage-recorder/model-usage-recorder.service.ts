import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@aucobot/database';
import { PrismaService } from '../../../../../core/database/prisma.service';
import { computeCostUsd } from '../../lib/compute-cost-usd';
import {
  consumePendingRun,
  parseGatewayUsageFrame,
} from '../../lib/parse-gateway-usage';
import type { GatewayTapContext, RecordUsageInput } from '../../lib/usage-record.types';

function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
  );
}

@Injectable()
export class ModelUsageRecorderService {
  private readonly log = new Logger(ModelUsageRecorderService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(input: RecordUsageInput): Promise<void> {
    const inputTokens = input.inputTokens ?? 0;
    const outputTokens = input.outputTokens ?? 0;
    const costUsd = await this.resolveCostUsd(
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
    this.recordFireAndForget({
      projectId: ctx.projectId,
      userId: ctx.userId,
      ...parsed,
    });
  }

  private async resolveCostUsd(
    providerId: string | null | undefined,
    modelId: string,
    inputTokens: number,
    outputTokens: number,
  ): Promise<string> {
    if (!providerId?.trim()) {
      return '0';
    }

    const pricing = await this.prisma.modelPricing.findUnique({
      where: {
        providerId_modelId: {
          providerId: providerId.trim(),
          modelId: modelId.trim(),
        },
      },
    });

    if (!pricing) {
      const slash = modelId.indexOf('/');
      if (slash > 0) {
        const nativeId = modelId.slice(slash + 1);
        const fallback = await this.prisma.modelPricing.findUnique({
          where: {
            providerId_modelId: {
              providerId: providerId.trim(),
              modelId: nativeId,
            },
          },
        });
        return computeCostUsd(inputTokens, outputTokens, fallback);
      }
      return '0';
    }

    return computeCostUsd(inputTokens, outputTokens, pricing);
  }
}
