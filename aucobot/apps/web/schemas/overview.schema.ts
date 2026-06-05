import { z } from 'zod'

export const overviewChartPeriodSchema = z.enum(['day', 'week', 'month'])

const overviewChartHourPointSchema = z.object({
  hour: z.number().int().min(0).max(23),
  value: z.number(),
})

const overviewChartDatePointSchema = z.object({
  date: z.string(),
  value: z.number(),
})

const overviewChartDayPointSchema = z.object({
  day: z.number().int().min(1).max(31),
  value: z.number(),
})

const overviewChartPointSchema = z.union([
  overviewChartHourPointSchema,
  overviewChartDatePointSchema,
  overviewChartDayPointSchema,
])

export const overviewMetricsSchema = z.object({
  totalInput: z.number(),
  totalOutput: z.number(),
  totalCostUsd: z.string(),
})

export const overviewRecentCallSchema = z.object({
  modelId: z.string(),
  providerId: z.string().nullable(),
  agentSlug: z.string().nullable(),
  source: z.string(),
  inputTokens: z.number(),
  outputTokens: z.number(),
  status: z.string(),
  latencyMs: z.number().nullable(),
  createdAt: z.string(),
})

export const overviewResponseSchema = z.object({
  timezone: z.string(),
  dateFrom: z.string(),
  dateTo: z.string(),
  chartPeriod: overviewChartPeriodSchema,
  metrics: overviewMetricsSchema,
  charts: z.object({
    input: z.array(overviewChartPointSchema),
    output: z.array(overviewChartPointSchema),
  }),
  recentCalls: z.array(overviewRecentCallSchema),
})

export type OverviewResponse = z.infer<typeof overviewResponseSchema>
export type OverviewChartPeriod = z.infer<typeof overviewChartPeriodSchema>
