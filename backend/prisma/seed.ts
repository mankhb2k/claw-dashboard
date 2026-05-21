import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ensureSelfHostDefaultUser } from '../src/core/auth/self-host-user';

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });
  const { login, created } = await ensureSelfHostDefaultUser(prisma);
  console.log(`Seed ok: login=${login} (${created ? 'created' : 'updated'})`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
