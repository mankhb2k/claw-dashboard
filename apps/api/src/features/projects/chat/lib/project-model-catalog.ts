import path from 'node:path';

import { resolveProvider } from '../../ai-providers/lib/provider-registry';
import {
  GEMINI_CHAT_MODELS,
  OPENAI_CHAT_MODELS,
  migrateFoundationOpenClawId,
  resolveGeminiSkillDefaultModel,
  resolveOpenAiSkillDefaultModel,
} from '@claw-dashboard/shared';
import { readOpenClawConfigJson } from '@claw-dashboard/workspace-sync';

import type { PrismaService } from '../../../../core/database/prisma.service';
import type { WorkspaceService } from '../../workspace/services/workspace/workspace.service';
import type { ChatModelProviderGroup } from '@claw-dashboard/shared';

export type {
  ChatModelOption,
  ChatModelProviderGroup,
} from '@claw-dashboard/shared';

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

function resolveDefaultModel(
  providerId: string,
  stored: string | null,
): string | null {
  if (providerId === 'openai') return resolveOpenAiSkillDefaultModel(stored);
  if (providerId === 'gemini') return resolveGeminiSkillDefaultModel(stored);
  const def = resolveProvider(providerId);
  const catalogIds = (def?.models ?? []).map((m) => m.openclawId);
  const migrated = migrateFoundationOpenClawId(stored);
  if (migrated && catalogIds.includes(migrated)) return migrated;
  if (stored?.trim() && catalogIds.includes(stored.trim()))
    return stored.trim();
  return def?.defaultModel ?? null;
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
  const config = await readOpenClawConfigJson(
    path.join(dataDir, 'openclaw.json'),
  );
  const defaults = (config?.agents as Record<string, unknown> | undefined)
    ?.defaults as Record<string, unknown> | undefined;
  const modelBlock = defaults?.model as Record<string, unknown> | undefined;
  const primaryModel = (() => {
    const raw =
      typeof modelBlock?.primary === 'string'
        ? modelBlock.primary.trim()
        : null;
    return raw ? migrateFoundationOpenClawId(raw) : null;
  })();

  const providers: ChatModelProviderGroup[] = [];
  const proxyModelRows = await params.prisma.projectProviderModel.findMany({
    where: { projectId: params.projectId },
  });
  const proxyModelsByProvider = new Map<string, typeof proxyModelRows>();
  for (const modelRow of proxyModelRows) {
    const list = proxyModelsByProvider.get(modelRow.providerId) ?? [];
    list.push(modelRow);
    proxyModelsByProvider.set(modelRow.providerId, list);
  }

  for (const row of rows) {
    const def = resolveProvider(row.providerId);
    if (!def) continue;
    let models = catalogForProvider(row.providerId);
    if (def.uiGroup === 'ai-provider') {
      const userModels = proxyModelsByProvider.get(row.providerId) ?? [];
      models = userModels.map((m) => ({
        id: m.openclawId,
        name: m.displayName?.trim() || m.openclawId,
        openclawId: m.openclawId,
      }));
    }
    const defaultModel = resolveDefaultModel(row.providerId, row.defaultModel);
    if (
      def.uiGroup === 'ai-provider' &&
      defaultModel &&
      !models.some((m) => m.openclawId === defaultModel)
    ) {
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
      uiGroup: def.uiGroup,
      defaultModel,
      tested: row.lastTestOk === true,
      models,
    });
  }

  return { primaryModel, providers };
}
