import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Default plans are also created by migration `20260426140000_baseline_plans` (for migrate deploy
  // without a separate seed step). This script upserts the same rows for local convenience.
  console.log('Seeding database...');

  // Upsert Free Plan
  const freePlan = await prisma.plan.upsert({
    where: { name: 'free' },
    update: {},
    create: {
      name: 'free',
      maxProjects: 1,
      maxConcurrentRunning: 1,
      maxKeepAliveProjects: 0,
      ramMb: 1024,
      cpuVcpu: 0.5,
      storageGb: 4,
      monthlyCredits: 0,
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
      maxProjects: 3,
      maxConcurrentRunning: 3,
      maxKeepAliveProjects: 1,
      ramMb: 2048,
      cpuVcpu: 1.0,
      storageGb: 10,
      monthlyCredits: 200,
      idleTimeoutMin: 60,
      priceMonthly: 2000,
    },
  });

  const packs = [
    { name: 'starter', credits: 120, priceUsd: 1000 },
    { name: 'standard', credits: 320, priceUsd: 2500 },
    { name: 'pro_pack', credits: 700, priceUsd: 5000 },
  ];
  for (const pack of packs) {
    await prisma.creditPack.upsert({
      where: { name: pack.name },
      update: { credits: pack.credits, priceUsd: pack.priceUsd, active: true },
      create: pack,
    });
  }

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
