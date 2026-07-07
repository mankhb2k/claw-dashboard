import type { Prisma } from '@claw-dashboard/database';

/** Prisma Json column input — caller must pass JSON-serializable data validated upstream. */
export function toPrismaInputJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}
