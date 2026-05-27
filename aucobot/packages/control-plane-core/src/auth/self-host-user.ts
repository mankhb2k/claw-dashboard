import type { PrismaClient } from '@aucobot/database';
import * as bcrypt from 'bcrypt';

/** Self-host: default username/password from env (additional users via register). */
export function selfHostUsernameFromEnv(): string {
  const raw =
    process.env.SELF_HOST_USER_USERNAME?.trim() ||
    process.env.SELF_HOST_USER_LOGIN?.trim() ||
    process.env.SEED_USER_LOGIN?.trim() ||
    'admin';
  return raw.toLowerCase();
}

/** @deprecated use selfHostUsernameFromEnv */
export const selfHostLoginFromEnv = selfHostUsernameFromEnv;

export function selfHostPasswordFromEnv(): string {
  return (
    process.env.SELF_HOST_USER_PASSWORD?.trim() ||
    process.env.SEED_USER_PASSWORD?.trim() ||
    'admin123'
  );
}

export function selfHostDisplayNameFromEnv(): string {
  return (
    process.env.SELF_HOST_USER_NAME?.trim() ||
    process.env.SEED_USER_NAME?.trim() ||
    'Admin'
  );
}

/**
 * Create or update the default user from env (password synced on each run).
 * Other rows in `users` are left unchanged.
 */
export async function ensureSelfHostDefaultUser(
  prisma: PrismaClient,
): Promise<{ username: string; created: boolean }> {
  const username = selfHostUsernameFromEnv();
  const password = selfHostPasswordFromEnv();
  if (password.length < 6) {
    throw new Error('SELF_HOST_USER_PASSWORD must be at least 6 characters');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await prisma.user.findUnique({ where: { username } });

  if (!existing) {
    await prisma.user.create({
      data: {
        username,
        passwordHash,
        name: selfHostDisplayNameFromEnv(),
      },
    });
    return { username, created: true };
  }

  await prisma.user.update({
    where: { username },
    data: {
      passwordHash,
      name: selfHostDisplayNameFromEnv(),
    },
  });
  return { username, created: false };
}
