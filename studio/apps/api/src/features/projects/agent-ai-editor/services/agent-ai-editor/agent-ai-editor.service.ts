import { randomUUID } from 'node:crypto';

import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../../core/database/prisma.service';
import { getDecryptedProviderKey } from '../../../ai-editor/lib/get-decrypted-provider-key';
import {
  recordEditorUsageFailure,
  recordEditorUsageSuccess,
} from '../../../ai-editor/lib/record-editor-usage';
import { ModelUsageRecorderService } from '../../../usage/services/model-usage-recorder/model-usage-recorder.service';
import {
  AGENT_AI_EDITOR_MAX_MARKDOWN_CHARS,
  AGENT_AI_EDITOR_MAX_MESSAGES,
} from '../../lib/agent-ai-editor.constants';
import {
  buildAgentAiEditorSystemPrompt,
  parseAgentAiEditorResponse,
} from '../../lib/agent-ai-editor.prompt';
import {
  getAgentAiEditorAdapter,
  isAgentAiEditorProviderSupported,
} from '../../providers/agent-ai-editor-registry';

import type {
  AgentAiEditorCompleteResult,
  AgentAiEditorMessage,
  AgentContextForPrompt,
} from '../../lib/agent-ai-editor.types';

@Injectable()
export class AgentAiEditorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usageRecorder: ModelUsageRecorderService,
  ) {}

  async complete(params: {
    userId: string;
    projectId: string;
    providerId: string;
    model: string;
    intent: 'optimize' | 'chat';
    messages: AgentAiEditorMessage[];
    agentContext: AgentContextForPrompt;
  }): Promise<AgentAiEditorCompleteResult> {
    const adapter = getAgentAiEditorAdapter(params.providerId);
    if (!adapter) {
      throw new BadRequestException('PROVIDER_NOT_SUPPORTED');
    }

    if (params.messages.length > AGENT_AI_EDITOR_MAX_MESSAGES) {
      throw new BadRequestException('Too many messages');
    }
    if (!params.messages.length) {
      throw new BadRequestException('At least one message is required');
    }

    const requestId = randomUUID();
    const usageBase = {
      projectId: params.projectId,
      userId: params.userId,
      externalId: `editor:agent:${requestId}`,
      providerId: params.providerId,
      modelId: params.model.trim(),
      agentSlug: params.agentContext.name?.trim() || null,
    };
    const usageMetadata = {
      feature: 'agent-ai-editor',
      intent: params.intent,
    };

    const apiKey = await getDecryptedProviderKey(
      this.prisma,
      params.projectId,
      params.providerId,
      {
        isSupported: isAgentAiEditorProviderSupported,
        unsupportedMessage:
          'Provider not supported for agent AI editor. Supported: gemini, openai',
        testFailureHint:
          'Provider key failed last test — open AI Model settings and test the key',
      },
    );
    const system = buildAgentAiEditorSystemPrompt({
      intent: params.intent,
      agentContext: params.agentContext,
    });

    try {
      const llm = await adapter.complete({
        apiKey,
        model: params.model.trim(),
        system,
        messages: params.messages,
      });

      const parsed = parseAgentAiEditorResponse(llm.text);

      if (parsed.phase === 'optimize' && parsed.markdown) {
        if (parsed.markdown.length > AGENT_AI_EDITOR_MAX_MARKDOWN_CHARS) {
          throw new BadRequestException('Generated AGENTS.md too large');
        }
      }

      recordEditorUsageSuccess(
        this.usageRecorder,
        usageBase,
        {
          inputTokens: llm.inputTokens,
          outputTokens: llm.outputTokens,
          latencyMs: llm.latencyMs,
        },
        usageMetadata,
      );

      return parsed;
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
