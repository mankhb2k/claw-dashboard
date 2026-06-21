import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../../core/database/prisma.service';
import {
  addDays,
  monthDateRange,
  normalizeTimezone,
  resolveMetricsDateRange,
} from '../../lib/overview-timezone.util';
import { Prisma, type UsageStatus } from '@aucobot/database';

type ChartPeriod = 'day' | 'week' | 'month';

type TokenRow = {
  input: bigint | number | null;
  output: bigint | number | null;
};

type HourlyRow = TokenRow & { hour: number | null };
type DailyRow = TokenRow & { day: string | null };

type MetricsRow = {
  total_input: bigint | number | null;
  total_output: bigint | number | null;
  total_cost: string | number | null;
};

export type OverviewChartPoint =
  | { hour: number; value: number }
  | { date: string; value: number }
  | { day: number; value: number };

@Injectable()
export class OverviewService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(params: {
    userId: string;
    projectId: string;
    dateFrom?: string;
    dateTo?: string;
    chartPeriod: ChartPeriod;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: params.userId },
      select: { analyticsTimezone: true },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const timezone = normalizeTimezone(user.analyticsTimezone);
    let dateFrom: string;
    let dateTo: string;
    try {
      ({ dateFrom, dateTo } = resolveMetricsDateRange(
        params.dateFrom,
        params.dateTo,
        timezone,
      ));
    } catch {
      throw new BadRequestException(
        'Invalid date range — use YYYY-MM-DD and ensure dateFrom <= dateTo',
      );
    }

    const [metrics, charts, recentCalls] = await Promise.all([
      this.loadMetrics(params.projectId, timezone, dateFrom, dateTo),
      this.loadCharts(params.projectId, timezone, dateTo, params.chartPeriod),
      this.loadRecentCalls(params.projectId),
    ]);

    return {
      timezone,
      dateFrom,
      dateTo,
      chartPeriod: params.chartPeriod,
      metrics,
      charts,
      recentCalls,
    };
  }

  private async loadMetrics(
    projectId: string,
    tz: string,
    dateFrom: string,
    dateTo: string,
  ) {
    const rows = await this.prisma.$queryRaw<MetricsRow[]>(
      Prisma.sql`
        SELECT
          COALESCE(SUM(input_tokens), 0) AS total_input,
          COALESCE(SUM(output_tokens), 0) AS total_output,
          COALESCE(SUM(cost_usd), 0) AS total_cost
        FROM model_usage_events
        WHERE project_id = ${projectId}
          AND (created_at AT TIME ZONE ${tz})::date >= ${dateFrom}::date
          AND (created_at AT TIME ZONE ${tz})::date <= ${dateTo}::date
      `,
    );

    const row = rows[0];
    return {
      totalInput: this.toNumber(row?.total_input),
      totalOutput: this.toNumber(row?.total_output),
      totalCostUsd: this.toDecimalString(row?.total_cost),
    };
  }

  private async loadCharts(
    projectId: string,
    tz: string,
    anchorDate: string,
    chartPeriod: ChartPeriod,
  ) {
    if (chartPeriod === 'day') {
      return this.loadDayCharts(projectId, tz, anchorDate);
    }
    if (chartPeriod === 'week') {
      return this.loadWeekCharts(projectId, tz, anchorDate);
    }
    return this.loadMonthCharts(projectId, tz, anchorDate);
  }

  private async loadDayCharts(
    projectId: string,
    tz: string,
    anchorDate: string,
  ) {
    const rows = await this.prisma.$queryRaw<HourlyRow[]>(
      Prisma.sql`
        SELECT
          EXTRACT(HOUR FROM (created_at AT TIME ZONE ${tz}))::int AS hour,
          COALESCE(SUM(input_tokens), 0) AS input,
          COALESCE(SUM(output_tokens), 0) AS output
        FROM model_usage_events
        WHERE project_id = ${projectId}
          AND (created_at AT TIME ZONE ${tz})::date = ${anchorDate}::date
        GROUP BY 1
        ORDER BY 1
      `,
    );

    const inputByHour = new Map<number, number>();
    const outputByHour = new Map<number, number>();
    for (const row of rows) {
      const hour = row.hour;
      if (hour === null || hour < 0 || hour > 23) continue;
      inputByHour.set(hour, this.toNumber(row.input));
      outputByHour.set(hour, this.toNumber(row.output));
    }

    const input: OverviewChartPoint[] = [];
    const output: OverviewChartPoint[] = [];
    for (let hour = 0; hour < 24; hour += 1) {
      input.push({ hour, value: inputByHour.get(hour) ?? 0 });
      output.push({ hour, value: outputByHour.get(hour) ?? 0 });
    }

    return { input, output };
  }

  private async loadWeekCharts(
    projectId: string,
    tz: string,
    anchorDate: string,
  ) {
    const startDate = addDays(anchorDate, -6);
    const rows = await this.prisma.$queryRaw<DailyRow[]>(
      Prisma.sql`
        SELECT
          TO_CHAR((created_at AT TIME ZONE ${tz})::date, 'YYYY-MM-DD') AS day,
          COALESCE(SUM(input_tokens), 0) AS input,
          COALESCE(SUM(output_tokens), 0) AS output
        FROM model_usage_events
        WHERE project_id = ${projectId}
          AND (created_at AT TIME ZONE ${tz})::date >= ${startDate}::date
          AND (created_at AT TIME ZONE ${tz})::date <= ${anchorDate}::date
        GROUP BY 1
        ORDER BY 1
      `,
    );

    const inputByDate = new Map<string, number>();
    const outputByDate = new Map<string, number>();
    for (const row of rows) {
      if (!row.day) continue;
      inputByDate.set(row.day, this.toNumber(row.input));
      outputByDate.set(row.day, this.toNumber(row.output));
    }

    const input: OverviewChartPoint[] = [];
    const output: OverviewChartPoint[] = [];
    for (let offset = 0; offset < 7; offset += 1) {
      const date = addDays(startDate, offset);
      input.push({ date, value: inputByDate.get(date) ?? 0 });
      output.push({ date, value: outputByDate.get(date) ?? 0 });
    }

    return { input, output };
  }

  private async loadMonthCharts(
    projectId: string,
    tz: string,
    anchorDate: string,
  ) {
    const { start, end, daysInMonth } = monthDateRange(anchorDate);
    const rows = await this.prisma.$queryRaw<
      Array<TokenRow & { day: number | null }>
    >(
      Prisma.sql`
        SELECT
          EXTRACT(DAY FROM (created_at AT TIME ZONE ${tz})::date)::int AS day,
          COALESCE(SUM(input_tokens), 0) AS input,
          COALESCE(SUM(output_tokens), 0) AS output
        FROM model_usage_events
        WHERE project_id = ${projectId}
          AND (created_at AT TIME ZONE ${tz})::date >= ${start}::date
          AND (created_at AT TIME ZONE ${tz})::date <= ${end}::date
        GROUP BY 1
        ORDER BY 1
      `,
    );

    const inputByDay = new Map<number, number>();
    const outputByDay = new Map<number, number>();
    for (const row of rows) {
      const day = row.day;
      if (day === null || day < 1) continue;
      inputByDay.set(day, this.toNumber(row.input));
      outputByDay.set(day, this.toNumber(row.output));
    }

    const input: OverviewChartPoint[] = [];
    const output: OverviewChartPoint[] = [];
    for (let day = 1; day <= daysInMonth; day += 1) {
      input.push({ day, value: inputByDay.get(day) ?? 0 });
      output.push({ day, value: outputByDay.get(day) ?? 0 });
    }

    return { input, output };
  }

  private async loadRecentCalls(projectId: string) {
    const rows = await this.prisma.modelUsageEvent.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        modelId: true,
        providerId: true,
        agentSlug: true,
        source: true,
        inputTokens: true,
        outputTokens: true,
        status: true,
        latencyMs: true,
        createdAt: true,
      },
    });

    return rows.map((row) => ({
      modelId: row.modelId,
      providerId: row.providerId,
      agentSlug: row.agentSlug,
      source: row.source,
      inputTokens: row.inputTokens,
      outputTokens: row.outputTokens,
      status: this.formatStatus(row.status),
      latencyMs: row.latencyMs,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  private formatStatus(status: UsageStatus): string {
    switch (status) {
      case 'SUCCESS':
        return 'Success';
      case 'FAILED':
        return 'Failed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  }

  private toNumber(value: bigint | number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    return typeof value === 'bigint' ? Number(value) : value;
  }

  private toDecimalString(
    value: string | number | bigint | null | undefined,
  ): string {
    if (value === null || value === undefined) return '0';
    if (typeof value === 'bigint') return value.toString();
    if (typeof value === 'number')
      return value.toFixed(6).replace(/\.?0+$/, '') || '0';
    const trimmed = String(value).trim();
    return trimmed.length > 0 ? trimmed : '0';
  }
}
