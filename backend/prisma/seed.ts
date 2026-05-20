import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });
  const email = process.env.SEED_USER_EMAIL ?? 'dev@example.com';
  const password = process.env.SEED_USER_PASSWORD ?? 'devpassword123';
  const hash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash: hash,
      name: 'Dev User',
    },
    update: {},
  });
  console.log(`Seed ok: ${email}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
