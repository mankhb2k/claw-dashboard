import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Upsert Free Plan
  const freePlan = await prisma.plan.upsert({
    where: { name: 'free' },
    update: {},
    create: {
      name: 'free',
      maxProjects: 1,
      ramMb: 1024,
      cpuVcpu: 0.5,
      storageGb: 4,
      heavyJobsPerDay: 3,
      idleTimeoutMin: 10,
      priceMonthly: 0,
    },
  });

  // Upsert Pro Plan
  const proPlan = await prisma.plan.upsert({
    where: { name: 'pro' },
    update: {},
    create: {
      name: 'pro',
      maxProjects: 10,
      ramMb: 2048,
      cpuVcpu: 1.0,
      storageGb: 100,
      heavyJobsPerDay: 100,
      idleTimeoutMin: 60,
      priceMonthly: 2999,
    },
  });

  console.log('✓ Free plan seeded:', freePlan);
  console.log('✓ Pro plan seeded:', proPlan);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
