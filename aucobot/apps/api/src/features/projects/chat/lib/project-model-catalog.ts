import path from 'node:path';
import type { PrismaService } from '../../../../core/database/prisma.service';
import {
  GEMINI_CHAT_MODELS,
  OPENAI_CHAT_MODELS,
  resolveGeminiSkillDefaultModel,
  resolveOpenAiSkillDefaultModel,
} from '@aucobot/shared';
import type { ChatModelProviderGroup } from '@aucobot/shared';
import { resolveProvider } from '../../ai-providers/lib/provider-registry';
import type { WorkspaceService } from '../../workspace/services/workspace/workspace.service';
import { readOpenClawConfigJson } from '@aucobot/workspace-sync';

export type { ChatModelOption, ChatModelProviderGroup } from '@aucobot/shared';

function catalogForProvider(providerId: string) {
  const def = resolveProvider(providerId);
  if (!def) return [];
  if (providerId === 'openai') {
    return OPENAI_CHAT_MODELS.map((m) => ({
      id: m.id,
      name: m.name,
      openclawId: m.openclawId,
    }));
  }
  if (providerId === 'gemini') {
    return GEMINI_CHAT_MODELS.map((m) => ({
      id: m.id,
      name: m.name,
      openclawId: m.openclawId,
    }));
  }
  return (def.models ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    openclawId: m.openclawId,
  }));
}

function resolveDefaultModel(providerId: string, stored: string | null): string | null {
  if (providerId === 'openai') return resolveOpenAiSkillDefaultModel(stored);
  if (providerId === 'gemini') return resolveGeminiSkillDefaultModel(stored);
  return stored?.trim() || resolveProvider(providerId)?.defaultModel || null;
}

export async function loadProjectModelCatalog(params: {
  prisma: PrismaService;
  workspace: WorkspaceService;
  projectId: string;
}): Promise<{
  primaryModel: string | null;
  providers: ChatModelProviderGroup[];
}> {
  const rows = await params.prisma.projectProviderKey.findMany({
    where: { projectId: params.projectId, enabled: true },
    orderBy: { updatedAt: 'desc' },
  });

  const dataDir = params.workspace.resolveProjectDataDir(params.projectId);
  const config = await readOpenClawConfigJson(path.join(dataDir, 'openclaw.json'));
  const defaults = (config?.agents as Record<string, unknown> | undefined)?.defaults as
    | Record<string, unknown>
    | undefined;
  const modelBlock = defaults?.model as Record<string, unknown> | undefined;
  const primaryModel =
    typeof modelBlock?.primary === 'string' ? modelBlock.primary.trim() : null;

  const providers: ChatModelProviderGroup[] = [];
  for (const row of rows) {
    const def = resolveProvider(row.providerId);
    if (!def) continue;
    let models = catalogForProvider(row.providerId);
    const defaultModel = resolveDefaultModel(row.providerId, row.defaultModel);
    if (defaultModel && !models.some((m) => m.openclawId === defaultModel)) {
      models = [
        { id: defaultModel, name: defaultModel, openclawId: defaultModel },
        ...models,
      ];
    }
    if (models.length === 0 && def.defaultModel) {
      models = [
        {
          id: def.defaultModel,
          name: def.defaultModel,
          openclawId: def.defaultModel,
        },
      ];
    }
    providers.push({
      providerId: row.providerId,
      displayName: def.displayName,
      defaultModel,
      tested: row.lastTestOk === true,
      models,
    });
  }

  return { primaryModel, providers };
}
