import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

export function createPrismaPgAdapter(connectionString: string): PrismaPg {
  return new PrismaPg({ connectionString });
}

export function createPrismaClient(connectionString: string): PrismaClient {
  return new PrismaClient({
    adapter: createPrismaPgAdapter(connectionString),
  });
}
