import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { AgentService } from '../agents/agent.service';
import { parseAgentFormData, readOpenClawConfigJson } from '@aucobot/workspace-sync';
import {
  GEMINI_CHAT_MODELS,
  resolveGeminiSkillDefaultModel,
} from '../ai-providers/gemini/gemini-models';
import {
  OPENAI_CHAT_MODELS,
  resolveOpenAiSkillDefaultModel,
} from '../ai-providers/openai/openai-models';
import { ProviderKeysService } from '../ai-providers/provider-keys.service';
import { PROVIDER_REGISTRY, resolveProvider } from '../ai-providers/provider-registry';
import { WorkspaceService } from '../workspace/workspace.service';
import path from 'node:path';

export type ChatModelOption = {
  id: string;
  name: string;
  openclawId: string;
};

export type ChatModelProviderGroup = {
  providerId: string;
  displayName: string;
  defaultModel: string | null;
  tested: boolean;
  models: ChatModelOption[];
};

const OPENCLAW_PREFIX_TO_PROVIDER: Record<string, string> = {
  google: 'gemini',
  openai: 'openai',
  anthropic: 'anthropic',
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

  private catalogForProvider(providerId: string): ChatModelOption[] {
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

  private resolveDefaultModel(providerId: string, stored: string | null): string | null {
    if (providerId === 'openai') return resolveOpenAiSkillDefaultModel(stored);
    if (providerId === 'gemini') return resolveGeminiSkillDefaultModel(stored);
    return stored?.trim() || resolveProvider(providerId)?.defaultModel || null;
  }

  private isModelInCatalog(
    providers: ChatModelProviderGroup[],
    openclawId: string,
  ): boolean {
    const trimmed = openclawId.trim();
    if (!trimmed) return false;
    return providers.some((provider) =>
      provider.models.some((model) => model.openclawId === trimmed),
    );
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
      const agent = await this.agents.get(projectId, agentId);
      const form = parseAgentFormData(agent.formData);
      const raw = typeof form.model === 'string' ? form.model.trim() : '';
      if (!raw) {
        return projectPrimary;
      }
      if (this.isModelInCatalog(providers, raw)) {
        return raw;
      }
      return projectPrimary;
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
    const rows = await this.prisma.projectProviderKey.findMany({
      where: { projectId, enabled: true },
      orderBy: { updatedAt: 'desc' },
    });

    const dataDir = this.workspace.resolveProjectDataDir(projectId);
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
      let models = this.catalogForProvider(row.providerId);
      const defaultModel = this.resolveDefaultModel(row.providerId, row.defaultModel);
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
