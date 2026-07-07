/** Prisma `UsageStatus` — mirror schema; lib/ dùng shared, service ghi DB qua Prisma enum. */
export const UsageStatus = {
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;

export type UsageStatus = (typeof UsageStatus)[keyof typeof UsageStatus];

export const USAGE_STATUSES = [
  UsageStatus.SUCCESS,
  UsageStatus.FAILED,
  UsageStatus.CANCELLED,
] as const;

/** Prisma `UsageSource` — mirror schema. */
export const UsageSource = {
  CHAT_UI: 'CHAT_UI',
  CHANNEL: 'CHANNEL',
  CRON: 'CRON',
  API_KEY: 'API_KEY',
  HEARTBEAT: 'HEARTBEAT',
  OTHER: 'OTHER',
} as const;

export type UsageSource = (typeof UsageSource)[keyof typeof UsageSource];

export const USAGE_SOURCES = [
  UsageSource.CHAT_UI,
  UsageSource.CHANNEL,
  UsageSource.CRON,
  UsageSource.API_KEY,
  UsageSource.HEARTBEAT,
  UsageSource.OTHER,
] as const;
