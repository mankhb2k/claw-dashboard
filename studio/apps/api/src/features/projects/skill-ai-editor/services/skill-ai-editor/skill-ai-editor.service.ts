import { randomUUID } from 'node:crypto';

import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../../core/database/prisma.service';
import { getDecryptedProviderKey } from '../../../ai-editor/lib/get-decrypted-provider-key';
import { listSkillEditorProviderOptions } from '../../../ai-editor/lib/list-editor-provider-options';
import {
  recordEditorUsageFailure,
  recordEditorUsageSuccess,
} from '../../../ai-editor/lib/record-editor-usage';
import { ModelUsageRecorderService } from '../../../usage/services/model-usage-recorder/model-usage-recorder.service';
import {
  SKILL_AI_EDITOR_MAX_MARKDOWN_CHARS,
  SKILL_AI_EDITOR_MAX_MESSAGES,
  SKILL_AI_EDITOR_SUPPORTED_PROVIDERS,
} from '../../lib/skill-ai-editor.constants';
import {
  buildSkillAiEditorSystemPrompt,
  type SkillContextForPrompt,
} from '../../lib/skill-ai-editor.prompt';
import {
  getSkillAiEditorAdapter,
  isSkillAiEditorProviderSupported,
} from '../../providers/skill-ai-editor-registry';

import type { EditorOptionProvider } from '../../../ai-editor/ai-editor.types';
import type { SkillAiEditorMessage } from '../../lib/skill-ai-editor.types';

export type SkillAiEditorOptionProvider = EditorOptionProvider;

@Injectable()
export class SkillAiEditorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usageRecorder: ModelUsageRecorderService,
  ) {}

  async listOptions(projectId: string): Promise<{
    providers: SkillAiEditorOptionProvider[];
  }> {
    return listSkillEditorProviderOptions(
      this.prisma,
      projectId,
      isSkillAiEditorProviderSupported,
    );
  }

  async complete(params: {
    userId: string;
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

    const requestId = randomUUID();
    const usageBase = {
      projectId: params.projectId,
      userId: params.userId,
      externalId: `editor:skill:${requestId}`,
      providerId: params.providerId,
      modelId: params.model.trim(),
    };
    const usageMetadata = {
      feature: 'skill-ai-editor',
      skillName: params.skillContext.name,
    };

    const apiKey = await getDecryptedProviderKey(
      this.prisma,
      params.projectId,
      params.providerId,
      {
        isSupported: isSkillAiEditorProviderSupported,
        unsupportedMessage: `Provider not supported for skill AI editor. Supported: ${SKILL_AI_EDITOR_SUPPORTED_PROVIDERS.join(', ')}`,
      },
    );
    const system = buildSkillAiEditorSystemPrompt(params.skillContext);

    try {
      const result = await adapter.complete({
        apiKey,
        model: params.model.trim(),
        system,
        messages: params.messages,
      });

      if (result.markdown.length > SKILL_AI_EDITOR_MAX_MARKDOWN_CHARS) {
        throw new BadRequestException('Generated markdown too large');
      }

      recordEditorUsageSuccess(
        this.usageRecorder,
        usageBase,
        {
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          latencyMs: result.latencyMs,
        },
        usageMetadata,
      );

      return { markdown: result.markdown };
    } catch (err) {
      recordEditorUsageFailure(
        this.usageRecorder,
        usageBase,
        err,
        usageMetadata,
      );
      throw err;
    }
  }
}
