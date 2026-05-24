import { createPrismaClient } from '@aucobot/database';

const projectId = process.argv[2] ?? 'cmpedzekq0001d4k5op1bk8bi';
const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}
const prisma = createPrismaClient(url);
const rows = await prisma.projectProviderKey.findMany({ where: { projectId } });
console.log(JSON.stringify(rows.map((r) => ({
  providerId: r.providerId,
  enabled: r.enabled,
  defaultModel: r.defaultModel,
  lastTestOk: r.lastTestOk,
  updatedAt: r.updatedAt,
})), null, 2));
await prisma.$disconnect();
