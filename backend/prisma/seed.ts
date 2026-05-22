import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ensureSelfHostDefaultUser } from '../src/core/auth/self-host-user';
import { AGENT_TEMPLATE_SEEDS } from './agent-templates.seed-data';

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });
  const { login, created } = await ensureSelfHostDefaultUser(prisma);
  for (const t of AGENT_TEMPLATE_SEEDS) {
    await prisma.agentTemplate.upsert({
      where: { slug: t.slug },
      create: t,
      update: {
        name: t.name,
        description: t.description,
        avatar: t.avatar,
        vibe: t.vibe,
        defaultModel: t.defaultModel,
        toolsProfile: t.toolsProfile,
        sandboxEnabled: t.sandboxEnabled,
        bootstrapIdentity: t.bootstrapIdentity,
        bootstrapSoul: t.bootstrapSoul,
        bootstrapAgents: t.bootstrapAgents,
        sortOrder: t.sortOrder,
        isActive: true,
      },
    });
  }
  console.log(
    `Seed ok: login=${login} (${created ? 'created' : 'updated'}), templates=${AGENT_TEMPLATE_SEEDS.length}`,
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
