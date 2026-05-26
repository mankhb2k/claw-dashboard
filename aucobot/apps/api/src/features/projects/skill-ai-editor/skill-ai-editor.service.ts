import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { decryptSecret } from '@aucobot/control-plane-core';
import {
  GEMINI_SKILL_AI_EDITOR_MODELS,
  resolveGeminiSkillDefaultModel,
} from '../ai-providers/gemini/gemini-models';
import {
  OPENAI_SKILL_AI_EDITOR_MODELS,
  resolveOpenAiSkillDefaultModel,
} from '../ai-providers/openai/openai-models';
import { resolveProvider } from '../ai-providers/provider-registry';
import {
  SKILL_AI_EDITOR_MAX_MARKDOWN_CHARS,
  SKILL_AI_EDITOR_MAX_MESSAGES,
  SKILL_AI_EDITOR_SUPPORTED_PROVIDERS,
} from './skill-ai-editor.constants';
import {
  buildSkillAiEditorSystemPrompt,
  type SkillContextForPrompt,
} from './skill-ai-editor.prompt';
import type { SkillAiEditorMessage } from './skill-ai-editor.types';
import {
  getSkillAiEditorAdapter,
  isSkillAiEditorProviderSupported,
} from './providers/skill-ai-editor-registry';

export type SkillAiEditorOptionModel = {
  id: string;
  name: string;
  openclawId: string;
};

export type SkillAiEditorOptionProvider = {
  providerId: string;
  displayName: string;
  defaultModel: string | null;
  models: SkillAiEditorOptionModel[];
};

@Injectable()
export class SkillAiEditorService {
  constructor(private readonly prisma: PrismaService) {}

  async listOptions(projectId: string): Promise<{
    providers: SkillAiEditorOptionProvider[];
  }> {
    const rows = await this.prisma.projectProviderKey.findMany({
      where: { projectId, enabled: true, lastTestOk: true },
      orderBy: { updatedAt: 'desc' },
    });

    const providers: SkillAiEditorOptionProvider[] = [];

    for (const row of rows) {
      if (!isSkillAiEditorProviderSupported(row.providerId)) {
        continue;
      }
      const def = resolveProvider(row.providerId);
      if (!def) continue;

      let models: SkillAiEditorOptionModel[];
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
        models = (def.models ?? []).map((m) => ({
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

  private async getDecryptedKey(
    projectId: string,
    providerId: string,
  ): Promise<string> {
    const provider = resolveProvider(providerId);
    if (!provider) {
      throw new BadRequestException(`Unknown provider: ${providerId}`);
    }
    if (!isSkillAiEditorProviderSupported(provider.id)) {
      throw new BadRequestException(
        `Provider not supported for skill AI editor. Supported: ${SKILL_AI_EDITOR_SUPPORTED_PROVIDERS.join(', ')}`,
      );
    }

    const row = await this.prisma.projectProviderKey.findUnique({
      where: {
        projectId_providerId: { projectId, providerId: provider.id },
      },
    });
    if (!row) {
      throw new NotFoundException('NO_PROVIDER_KEY');
    }
    if (!row.enabled) {
      throw new BadRequestException('PROVIDER_DISABLED');
    }
    if (row.lastTestOk === false) {
      throw new BadRequestException(
        row.lastError ?? 'Provider key failed last test',
      );
    }

    return decryptSecret(row.ciphertext);
  }

  async complete(params: {
    projectId: string;
    providerId: string;
    model: string;
    messages: SkillAiEditorMessage[];
    skillContext: SkillContextForPrompt;
  }): Promise<{ markdown: string }> {
    const adapter = getSkillAiEditorAdapter(params.providerId);
    if (!adapter) {
      throw new BadRequestException('PROVIDER_NOT_SUPPORTED');
    }

    if (params.messages.length > SKILL_AI_EDITOR_MAX_MESSAGES) {
      throw new BadRequestException('Too many messages');
    }

    const apiKey = await this.getDecryptedKey(params.projectId, params.providerId);
    const system = buildSkillAiEditorSystemPrompt(params.skillContext);

    const result = await adapter.complete({
      apiKey,
      model: params.model.trim(),
      system,
      messages: params.messages,
    });

    if (result.markdown.length > SKILL_AI_EDITOR_MAX_MARKDOWN_CHARS) {
      throw new BadRequestException('Generated markdown too large');
    }

    return { markdown: result.markdown };
  }
}
