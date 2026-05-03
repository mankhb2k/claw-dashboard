import { PrismaService } from '../database/prisma.service';
import { ensureDefaultFreeSubscription } from '../billing/ensure-free-subscription';

function getBaseUrl(): string {
  return process.env.API_URL ?? 'http://localhost:3001';
}

function getTrustedOrigins(): string[] {
  const frontend = process.env.FRONTEND_URL ?? 'http://localhost:3000';
  return [frontend];
}

export async function createBetterAuth(prisma: PrismaService) {
  const [{ betterAuth }, { prismaAdapter }] = await Promise.all([
    import('better-auth'),
    import('better-auth/adapters/prisma'),
  ]);

  return betterAuth({
    secret: process.env.BETTER_AUTH_SECRET ?? 'dev-only-better-auth-secret',
    baseURL: getBaseUrl(),
    trustedOrigins: getTrustedOrigins(),
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
    session: {
      cookieCache: { enabled: false },
    },
    emailAndPassword: {
      enabled: true,
    },
    socialProviders:
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            },
          }
        : {},
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await ensureDefaultFreeSubscription(prisma, user.id);
          },
        },
      },
    },
  });
}
