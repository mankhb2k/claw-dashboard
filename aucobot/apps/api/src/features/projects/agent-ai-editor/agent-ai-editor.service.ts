import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { decryptSecret } from '@aucobot/control-plane-core';
import { PrismaService } from '../../../core/database/prisma.service';
import { resolveProvider } from '../ai-providers/provider-registry';
import {
  AGENT_AI_EDITOR_MAX_MARKDOWN_CHARS,
  AGENT_AI_EDITOR_MAX_MESSAGES,
  AGENT_AI_EDITOR_SUPPORTED_PROVIDERS,
} from './agent-ai-editor.constants';
import { completeAgentAiEditorRaw } from './agent-ai-editor.llm';
import {
  buildAgentAiEditorSystemPrompt,
  parseAgentAiEditorResponse,
} from './agent-ai-editor.prompt';
import type {
  AgentAiEditorCompleteResult,
  AgentAiEditorMessage,
  AgentContextForPrompt,
} from './agent-ai-editor.types';

function isSupportedProvider(
  providerId: string,
): providerId is (typeof AGENT_AI_EDITOR_SUPPORTED_PROVIDERS)[number] {
  return (AGENT_AI_EDITOR_SUPPORTED_PROVIDERS as readonly string[]).includes(
    providerId.trim(),
  );
}

@Injectable()
export class AgentAiEditorService {
  constructor(private readonly prisma: PrismaService) {}

  private async getDecryptedKey(
    projectId: string,
    providerId: string,
  ): Promise<string> {
    const provider = resolveProvider(providerId);
    if (!provider) {
      throw new BadRequestException(`Unknown provider: ${providerId}`);
    }
    if (!isSupportedProvider(provider.id)) {
      throw new BadRequestException(
        `Provider not supported for agent AI editor. Supported: ${AGENT_AI_EDITOR_SUPPORTED_PROVIDERS.join(', ')}`,
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
        row.lastError ??
          'Provider key failed last test — open AI Model settings and test the key',
      );
    }

    return decryptSecret(row.ciphertext);
  }

  async complete(params: {
    projectId: string;
    providerId: string;
    model: string;
    intent: 'optimize' | 'chat';
    messages: AgentAiEditorMessage[];
    agentContext: AgentContextForPrompt;
  }): Promise<AgentAiEditorCompleteResult> {
    if (params.messages.length > AGENT_AI_EDITOR_MAX_MESSAGES) {
      throw new BadRequestException('Too many messages');
    }
    if (!params.messages.length) {
      throw new BadRequestException('At least one message is required');
    }

    const apiKey = await this.getDecryptedKey(params.projectId, params.providerId);
    const system = buildAgentAiEditorSystemPrompt({
      intent: params.intent,
      agentContext: params.agentContext,
    });

    const raw = await completeAgentAiEditorRaw({
      providerId: params.providerId.trim(),
      apiKey,
      model: params.model.trim(),
      system,
      messages: params.messages,
    });

    const parsed = parseAgentAiEditorResponse(raw);

    if (parsed.phase === 'optimize' && parsed.markdown) {
      if (parsed.markdown.length > AGENT_AI_EDITOR_MAX_MARKDOWN_CHARS) {
        throw new BadRequestException('Generated AGENTS.md too large');
      }
    }

    return parsed;
  }
}
