import { loadMonorepoEnv } from '../../../scripts/load-monorepo-env.mjs';

loadMonorepoEnv();

import { createPrismaClient } from '../src/create-prisma-client';
import { AGENT_TEMPLATE_SEEDS } from './agent-templates.seed-data';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is required for db seed');
  }

  const prisma = createPrismaClient(url);
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
  console.log(`Seed ok: agent templates=${AGENT_TEMPLATE_SEEDS.length}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
