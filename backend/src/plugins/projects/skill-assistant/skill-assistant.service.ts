import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { decryptSecret } from '../../../core/crypto/secret-crypto';
import {
  GEMINI_SKILL_ASSISTANT_MODELS,
  resolveGeminiSkillDefaultModel,
} from '../providers/gemini-models';
import {
  OPENAI_SKILL_ASSISTANT_MODELS,
  resolveOpenAiSkillDefaultModel,
} from '../providers/openai-models';
import { resolveProvider } from '../providers/provider-registry';
import {
  SKILL_ASSISTANT_MAX_MARKDOWN_CHARS,
  SKILL_ASSISTANT_MAX_MESSAGES,
  SKILL_ASSISTANT_SUPPORTED_PROVIDERS,
} from './skill-assistant.constants';
import {
  buildSkillAssistantSystemPrompt,
  type SkillContextForPrompt,
} from './skill-assistant.prompt';
import type { SkillAssistantMessage } from './skill-assistant.types';
import { getSkillAssistantAdapter, isSkillAssistantProviderSupported } from './providers/skill-assistant-registry';

export type SkillAssistantOptionModel = {
  id: string;
  name: string;
  openclawId: string;
};

export type SkillAssistantOptionProvider = {
  providerId: string;
  displayName: string;
  defaultModel: string | null;
  models: SkillAssistantOptionModel[];
};

@Injectable()
export class SkillAssistantService {
  constructor(private readonly prisma: PrismaService) {}

  async listOptions(projectId: string): Promise<{
    providers: SkillAssistantOptionProvider[];
  }> {
    const rows = await this.prisma.projectProviderKey.findMany({
      where: { projectId, enabled: true, lastTestOk: true },
      orderBy: { updatedAt: 'desc' },
    });

    const providers: SkillAssistantOptionProvider[] = [];

    for (const row of rows) {
      if (!isSkillAssistantProviderSupported(row.providerId)) {
        continue;
      }
      const def = resolveProvider(row.providerId);
      if (!def) continue;

      let models: SkillAssistantOptionModel[];
      let defaultModel: string | null;

      if (row.providerId === 'openai') {
        models = OPENAI_SKILL_ASSISTANT_MODELS.map((m) => ({
          id: m.id,
          name: m.name,
          openclawId: m.openclawId,
        }));
        defaultModel = resolveOpenAiSkillDefaultModel(row.defaultModel);
      } else if (row.providerId === 'gemini') {
        models = GEMINI_SKILL_ASSISTANT_MODELS.map((m) => ({
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
    if (!isSkillAssistantProviderSupported(provider.id)) {
      throw new BadRequestException(
        `Provider not supported for skill assistant. Supported: ${SKILL_ASSISTANT_SUPPORTED_PROVIDERS.join(', ')}`,
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
    messages: SkillAssistantMessage[];
    skillContext: SkillContextForPrompt;
  }): Promise<{ markdown: string }> {
    const adapter = getSkillAssistantAdapter(params.providerId);
    if (!adapter) {
      throw new BadRequestException('PROVIDER_NOT_SUPPORTED');
    }

    if (params.messages.length > SKILL_ASSISTANT_MAX_MESSAGES) {
      throw new BadRequestException('Too many messages');
    }

    const apiKey = await this.getDecryptedKey(params.projectId, params.providerId);
    const system = buildSkillAssistantSystemPrompt(params.skillContext);

    const result = await adapter.complete({
      apiKey,
      model: params.model.trim(),
      system,
      messages: params.messages,
    });

    if (result.markdown.length > SKILL_ASSISTANT_MAX_MARKDOWN_CHARS) {
      throw new BadRequestException('Generated markdown too large');
    }

    return { markdown: result.markdown };
  }
}
