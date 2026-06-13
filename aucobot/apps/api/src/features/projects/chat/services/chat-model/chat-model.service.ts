import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database/prisma.service';
import { AgentService } from '../../../agents/services/agent/agent.service';
import {
  resolveEffectiveAgentModel,
  type ChatModelProviderGroup,
} from '@aucobot/shared';
import { parseAgentFormData } from '@aucobot/workspace-sync';
import { ProviderKeysService } from '../../../ai-providers/services/provider-keys/provider-keys.service';
import { resolveProvider } from '../../../ai-providers/lib/provider-registry';
import { WorkspaceService } from '../../../workspace/services/workspace/workspace.service';
import { loadProjectModelCatalog } from '../../lib/project-model-catalog';

const OPENCLAW_PREFIX_TO_PROVIDER: Record<string, string> = {
  google: 'gemini',
  openai: 'openai',
  anthropic: 'anthropic',
  deepseek: 'deepseek',
  groq: 'groq',
  mistral: 'mistral',
  openrouter: 'openrouter',
  together: 'together',
  'vercel-ai-gateway': 'vercel-ai-gateway',
  kilocode: 'kilocode',
};

@Injectable()
export class ChatModelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspace: WorkspaceService,
    private readonly providerKeys: ProviderKeysService,
    private readonly agents: AgentService,
  ) {}

  resolveProviderIdForOpenClawModel(openclawId: string): string {
    const trimmed = openclawId.trim();
    const slash = trimmed.indexOf('/');
    if (slash > 0) {
      const prefix = trimmed.slice(0, slash);
      const mapped = OPENCLAW_PREFIX_TO_PROVIDER[prefix];
      if (mapped) return mapped;
    }
    if (/^gemini-/i.test(trimmed)) return 'gemini';
    if (/^gpt-/i.test(trimmed) || /^o\d/i.test(trimmed)) return 'openai';
    if (/^claude-/i.test(trimmed)) return 'anthropic';
    throw new BadRequestException(`Cannot resolve provider for model: ${openclawId}`);
  }

  private async resolveAgentPrimaryModel(
    projectId: string,
    agentId: string,
    projectPrimary: string | null,
    providers: ChatModelProviderGroup[],
  ): Promise<string | null> {
    if (agentId === 'main') {
      return projectPrimary;
    }

    try {
      const row = await this.prisma.projectAgent.findUnique({
        where: { projectId_slug: { projectId, slug: agentId } },
        select: { formData: true },
      });
      if (!row) {
        return projectPrimary;
      }
      const form = parseAgentFormData(row.formData);
      return resolveEffectiveAgentModel({
        formModel: form.model,
        projectPrimary,
        providers,
      });
    } catch {
      return projectPrimary;
    }
  }

  async listModels(
    projectId: string,
    agentId?: string,
  ): Promise<{
    primaryModel: string | null;
    agentPrimaryModel: string | null;
    providers: ChatModelProviderGroup[];
  }> {
    const { primaryModel, providers } = await loadProjectModelCatalog({
      prisma: this.prisma,
      workspace: this.workspace,
      projectId,
    });

    const trimmedAgentId = agentId?.trim();
    const agentPrimaryModel = trimmedAgentId
      ? await this.resolveAgentPrimaryModel(
          projectId,
          trimmedAgentId,
          primaryModel,
          providers,
        )
      : primaryModel;

    return { primaryModel, agentPrimaryModel, providers };
  }

  /** @deprecated Dashboard Chat uses gateway `sessions.patch` for session overrides. */
  async setModel(params: {
    projectId: string;
    agentId: string;
    model: string;
  }): Promise<{ model: string; primaryModel: string | null }> {
    const openclawId = params.model.trim();
    if (!openclawId) {
      throw new BadRequestException('Model is required');
    }

    const providerId = this.resolveProviderIdForOpenClawModel(openclawId);
    const provider = resolveProvider(providerId);
    if (!provider) {
      throw new BadRequestException(`Unknown provider: ${providerId}`);
    }

    const keyRow = await this.prisma.projectProviderKey.findUnique({
      where: {
        projectId_providerId: {
          projectId: params.projectId,
          providerId,
        },
      },
    });
    if (!keyRow?.enabled) {
      throw new BadRequestException(
        `No enabled API key for ${provider.displayName}. Add one under AI Model settings.`,
      );
    }

    if (params.agentId === 'main') {
      await this.providerKeys.setDefaultModel(params.projectId, providerId, openclawId);
    } else {
      const agent = await this.agents.get(params.projectId, params.agentId).catch(() => null);
      if (!agent) {
        throw new NotFoundException(`Agent not found: ${params.agentId}`);
      }
      const form = parseAgentFormData(agent.formData);
      form.model = openclawId;
      await this.agents.update(params.projectId, params.agentId, {
        formData: { ...form } as Record<string, unknown>,
      });
      await this.providerKeys.setDefaultModel(params.projectId, providerId, openclawId);
    }

    const listed = await this.listModels(params.projectId);
    return { model: openclawId, primaryModel: listed.primaryModel };
  }
}
