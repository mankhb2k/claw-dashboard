import { resolveProvider } from '../../ai-providers/lib/provider-registry';
import {
  GEMINI_SKILL_AI_EDITOR_MODELS,
  OPENAI_SKILL_AI_EDITOR_MODELS,
  resolveGeminiSkillDefaultModel,
  resolveOpenAiSkillDefaultModel,
} from '@claw-dashboard/shared';

import type { PrismaService } from '../../../../core/database/prisma.service';
import type {
  EditorOptionModel,
  EditorOptionProvider,
} from '../ai-editor.types';

type ProviderKeyRow = {
  providerId: string;
  defaultModel: string | null;
};

export async function listSkillEditorProviderOptions(
  prisma: PrismaService,
  projectId: string,
  isSupported: (providerId: string) => boolean,
): Promise<{ providers: EditorOptionProvider[] }> {
  const rows = await prisma.projectProviderKey.findMany({
    where: { projectId, enabled: true, lastTestOk: true },
    orderBy: { updatedAt: 'desc' },
  });

  const providers: EditorOptionProvider[] = [];

  for (const row of rows) {
    if (!isSupported(row.providerId)) continue;
    const def = resolveProvider(row.providerId);
    if (!def) continue;

    let models: EditorOptionModel[];
    let defaultModel: string | null;

    if (row.providerId === 'openai') {
      models = OPENAI_SKILL_AI_EDITOR_MODELS.map((m) => ({
        id: m.id,
        name: m.name,
        openclawId: m.openclawId,
      }));
      defaultModel = resolveOpenAiSkillDefaultModel(row.defaultModel);
    } else if (row.providerId === 'gemini') {
      models = GEMINI_SKILL_AI_EDITOR_MODELS.map((m) => ({
        id: m.id,
        name: m.name,
        openclawId: m.openclawId,
      }));
      defaultModel = resolveGeminiSkillDefaultModel(row.defaultModel);
    } else {
      models = mapGenericProviderModels(def, row);
      defaultModel = row.defaultModel ?? def.defaultModel ?? null;
    }

    providers.push({
      providerId: row.providerId,
      displayName: def.displayName,
      defaultModel,
      models,
    });
  }

  return { providers };
}

function mapGenericProviderModels(
  def: NonNullable<ReturnType<typeof resolveProvider>>,
  row: ProviderKeyRow,
): EditorOptionModel[] {
  const models = (def.models ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    openclawId: m.openclawId,
  }));

  if (models.length === 0 && def.defaultModel) {
    models.push({
      id: def.defaultModel.split('/').pop() ?? def.defaultModel,
      name: def.defaultModel,
      openclawId: def.defaultModel,
    });
  }

  if (row.defaultModel) {
    const hasDefault = models.some(
      (m) => m.openclawId === row.defaultModel || m.id === row.defaultModel,
    );
    if (!hasDefault) {
      models.unshift({
        id: row.defaultModel,
        name: row.defaultModel,
        openclawId: row.defaultModel,
      });
    }
  }

  return models;
}
