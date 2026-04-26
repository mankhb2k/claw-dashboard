import { APIError } from 'better-auth/api';
import type { PrismaService } from '../database/prisma.service';

/**
 * Creates an ACTIVE subscription on the `free` plan for a new user (idempotent).
 * Used from Better Auth `databaseHooks.user.create.after`.
 */
export async function ensureDefaultFreeSubscription(
  prisma: PrismaService,
  userId: string,
): Promise<void> {
  const free = await prisma.plan.findUnique({ where: { name: 'free' } });
  if (!free) {
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Free plan not configured. Apply Prisma migrations (baseline plans).',
    });
  }

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      planId: free.id,
      status: 'ACTIVE',
    },
    update: {},
  });
}
