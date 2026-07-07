import { z } from "zod";

const cronScheduleSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("at"), at: z.string() }),
  z.object({ kind: z.literal("every"), everyMs: z.number() }),
  z.object({ kind: z.literal("cron"), expr: z.string() }),
]);

export const cronJobSchema = z.object({
  id: z.string(),
  name: z.string(),
  agentId: z.string().optional(),
  enabled: z.boolean(),
  schedule: cronScheduleSchema,
  payload: z
    .object({
      kind: z.string(),
      message: z.string().optional(),
      text: z.string().optional(),
    })
    .passthrough(),
  state: z
    .object({
      nextRunAtMs: z.number().optional(),
      lastRunAtMs: z.number().optional(),
      lastRunStatus: z.string().optional(),
      lastStatus: z.string().optional(),
      lastError: z.string().optional(),
    })
    .optional(),
});

export const cronListResponseSchema = z.object({
  jobs: z.array(cronJobSchema),
  total: z.number(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

const cronRecentFailureSchema = z.object({
  id: z.string(),
  name: z.string(),
  agentId: z.string().optional(),
});

export const cronSummarySchema = z.object({
  enabled: z.boolean(),
  jobCount: z.number(),
  total: z.number(),
  limit: z.number(),
  remaining: z.number(),
  failedCount: z.number().optional().default(0),
  recentFailures: z.array(cronRecentFailureSchema).optional().default([]),
});

export const createCronJobInputSchema = z.object({
  name: z.string().min(1).max(120),
  agentId: z.string().min(1).max(80),
  message: z.string().min(1).max(8000),
  scheduleKind: z.enum(["cron", "every", "at"]),
  cronExpr: z.string().max(120).optional(),
  everyMinutes: z.number().int().min(1).max(10080).optional(),
  at: z.string().max(64).optional(),
  enabled: z.boolean().optional(),
});

export const updateCronJobInputSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  message: z.string().min(1).max(8000).optional(),
  scheduleKind: z.enum(["cron", "every", "at"]).optional(),
  cronExpr: z.string().max(120).optional(),
  everyMinutes: z.number().int().min(1).max(10080).optional(),
  at: z.string().max(64).optional(),
  enabled: z.boolean().optional(),
});

export type CronJob = z.infer<typeof cronJobSchema>;
export type CronListResponse = z.infer<typeof cronListResponseSchema>;
export type CronSummary = z.infer<typeof cronSummarySchema>;
export type CreateCronJobInput = z.infer<typeof createCronJobInputSchema>;
export type UpdateCronJobInput = z.infer<typeof updateCronJobInputSchema>;
