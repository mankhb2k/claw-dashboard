import type { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

/** Self-host: đăng nhập/mật khẩu mặc định từ env (vẫn có thể thêm user qua register). */
export function selfHostLoginFromEnv(): string {
  const raw =
    process.env.SELF_HOST_USER_LOGIN?.trim() ||
    process.env.SEED_USER_LOGIN?.trim() ||
    'admin';
  return raw.toLowerCase();
}

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
 * Tạo hoặc cập nhật user mặc định theo env (mật khẩu đồng bộ mỗi lần chạy).
 * User khác trong bảng `users` không bị đụng tới.
 */
export async function ensureSelfHostDefaultUser(
  prisma: PrismaClient,
): Promise<{ login: string; created: boolean }> {
  const login = selfHostLoginFromEnv();
  const password = selfHostPasswordFromEnv();
  if (password.length < 6) {
    throw new Error('SELF_HOST_USER_PASSWORD must be at least 6 characters');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await prisma.user.findUnique({ where: { login } });

  if (!existing) {
    await prisma.user.create({
      data: {
        login,
        passwordHash,
        name: selfHostDisplayNameFromEnv(),
      },
    });
    return { login, created: true };
  }

  await prisma.user.update({
    where: { login },
    data: {
      passwordHash,
      name: selfHostDisplayNameFromEnv(),
    },
  });
  return { login, created: false };
}
