import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });
  const login = (process.env.SEED_USER_LOGIN ?? 'admin').trim().toLowerCase();
  const password = process.env.SEED_USER_PASSWORD ?? 'admin123';
  const hash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { login },
    create: {
      login,
      passwordHash: hash,
      name: 'Admin',
    },
    update: {},
  });
  console.log(`Seed ok: login=${login}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
