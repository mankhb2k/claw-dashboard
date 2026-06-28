import {
  GEMINI_CHAT_MODELS,
  GEMINI_DEFAULT_OPENCLAW_MODEL,
  GEMINI_OPENCLAW_PROVIDER,
  OPENAI_CHAT_MODELS,
  OPENAI_DEFAULT_OPENCLAW_MODEL,
} from '@aucobot/shared';

import type { ProviderDefinition } from './provider-registry.types';

export type {
  ProviderCategory,
  ProviderDefinition,
  ProviderModelCatalogEntry,
  ProviderOpenAiCompatTestConfig,
  ProviderUiGroup,
} from './provider-registry.types';

const ANTHROPIC_MODELS = [
  {
    id: 'claude-opus-4-8',
    name: 'Claude Opus 4.8',
    openclawId: 'anthropic/claude-opus-4-8',
    description: 'Flagship — deepest reasoning',
  },
  {
    id: 'claude-opus-4-6',
    name: 'Claude Opus 4.6',
    openclawId: 'anthropic/claude-opus-4-6',
    description: 'Opus-class — agentic coding, 1M context (beta)',
  },
  {
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    openclawId: 'anthropic/claude-sonnet-4-6',
    recommended: true,
    description: 'Default — agents, coding, 1M context (beta)',
  },
  {
    id: 'claude-haiku-4-5',
    name: 'Claude Haiku 4.5',
    openclawId: 'anthropic/claude-haiku-4-5',
    description: 'Fast, cost-efficient',
  },
] satisfies ProviderDefinition['models'];

const DEEPSEEK_MODELS = [
  {
    id: 'deepseek-v4-flash',
    name: 'DeepSeek V4 Flash',
    openclawId: 'deepseek/deepseek-v4-flash',
    recommended: true,
    description: 'Fast, economical choice with 1M context',
  },
  {
    id: 'deepseek-v4-pro',
    name: 'DeepSeek V4 Pro',
    openclawId: 'deepseek/deepseek-v4-pro',
    description: 'Top-tier reasoning and agent capabilities',
  },
] satisfies ProviderDefinition['models'];

const GROK_MODELS = [
  {
    id: 'grok-4.3',
    name: 'Grok 4.3',
    openclawId: 'xai/grok-4.3',
    recommended: true,
    description: 'Latest flagship — chat, coding, agents',
  },
  {
    id: 'grok-4',
    name: 'Grok 4',
    openclawId: 'xai/grok-4',
    description: 'Previous flagship reasoning model',
  },
  {
    id: 'grok-3-mini',
    name: 'Grok 3 Mini',
    openclawId: 'xai/grok-3-mini',
    description: 'Fast, cost-efficient',
  },
] satisfies ProviderDefinition['models'];

const MISTRAL_MODELS = [
  {
    id: 'mistral-large-latest',
    name: 'Mistral Large',
    openclawId: 'mistral/mistral-large-latest',
    recommended: true,
    description: 'Flagship reasoning & agents',
  },
  {
    id: 'mistral-small-latest',
    name: 'Mistral Small',
    openclawId: 'mistral/mistral-small-latest',
    description: 'Fast, cost-efficient',
  },
  {
    id: 'devstral-latest',
    name: 'Devstral 2',
    openclawId: 'mistral/devstral-latest',
    description: 'Agentic coding',
  },
  {
    id: 'codestral-latest',
    name: 'Codestral',
    openclawId: 'mistral/codestral-latest',
    description: 'Code completion & FIM',
  },
] satisfies ProviderDefinition['models'];

export const PROVIDER_REGISTRY: ProviderDefinition[] = [
  {
    id: 'openai',
    displayName: 'OpenAI',
    envKey: 'OPENAI_API_KEY',
    uiGroup: 'foundation',
    category: 'direct',
    defaultModel: OPENAI_DEFAULT_OPENCLAW_MODEL,
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    docsUrl: 'https://developers.openai.com/api/docs/models',
    models: OPENAI_CHAT_MODELS.map((m) => ({
      id: m.id,
      name: m.name,
      openclawId: m.openclawId,
      tier: m.tier,
      description: m.description,
      recommended: m.recommended,
    })),
  },
  {
    id: 'anthropic',
    displayName: 'Claude',
    envKey: 'ANTHROPIC_API_KEY',
    uiGroup: 'foundation',
    category: 'direct',
    defaultModel: 'anthropic/claude-sonnet-4-6',
    apiKeyUrl: 'https://console.anthropic.com/settings/keys',
    docsUrl: 'https://docs.anthropic.com/en/docs/about-claude/models',
    models: ANTHROPIC_MODELS,
  },
  {
    id: 'gemini',
    displayName: 'Google Gemini',
    envKey: 'GEMINI_API_KEY',
    uiGroup: 'foundation',
    category: 'direct',
    openclawProviderId: GEMINI_OPENCLAW_PROVIDER,
    defaultModel: GEMINI_DEFAULT_OPENCLAW_MODEL,
    apiKeyUrl: 'https://aistudio.google.com/apikey',
    docsUrl: 'https://ai.google.dev/gemini-api/docs/models',
    models: GEMINI_CHAT_MODELS.map((m) => ({
      id: m.id,
      name: m.name,
      openclawId: m.openclawId,
      tier: m.tier,
      description: m.description,
      recommended: m.recommended,
      isFree: m.isFree,
    })),
  },
  {
    id: 'deepseek',
    displayName: 'DeepSeek',
    envKey: 'DEEPSEEK_API_KEY',
    uiGroup: 'foundation',
    category: 'direct',
    defaultModel: 'deepseek/deepseek-v4-flash',
    apiKeyUrl: 'https://platform.deepseek.com/api_keys',
    docsUrl: 'https://api-docs.deepseek.com/',
    models: DEEPSEEK_MODELS,
    openAiCompatTest: {
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-v4-flash',
    },
  },
  {
    id: 'grok',
    displayName: 'Grok',
    envKey: 'XAI_API_KEY',
    uiGroup: 'foundation',
    category: 'direct',
    openclawProviderId: 'xai',
    defaultModel: 'xai/grok-4.3',
    apiKeyUrl: 'https://console.x.ai/team/default/api-keys',
    docsUrl: 'https://docs.x.ai/developers/models',
    models: GROK_MODELS,
    openAiCompatTest: {
      baseUrl: 'https://api.x.ai/v1',
      model: 'grok-4.3',
    },
  },
  {
    id: 'mistral',
    displayName: 'Mistral',
    envKey: 'MISTRAL_API_KEY',
    uiGroup: 'foundation',
    category: 'direct',
    defaultModel: 'mistral/mistral-large-latest',
    apiKeyUrl: 'https://console.mistral.ai/api-keys/',
    docsUrl: 'https://docs.mistral.ai/getting-started/models',
    models: MISTRAL_MODELS,
    openAiCompatTest: {
      baseUrl: 'https://api.mistral.ai/v1',
      model: 'mistral-small-latest',
    },
  },
  {
    id: 'openrouter',
    displayName: 'OpenRouter',
    envKey: 'OPENROUTER_API_KEY',
    uiGroup: 'ai-provider',
    category: 'proxy',
    openclawProviderId: 'openrouter',
    defaultModel: 'openrouter/auto',
    modelRefHint: 'openrouter/<vendor>/<model>',
    apiKeyUrl: 'https://openrouter.ai/keys',
    docsUrl: 'https://openrouter.ai/docs',
    starterModels: [
      {
        id: 'auto',
        name: 'Auto routing',
        openclawId: 'openrouter/auto',
        recommended: true,
      },
      {
        id: 'claude-sonnet',
        name: 'Claude Sonnet (via OpenRouter)',
        openclawId: 'openrouter/anthropic/claude-sonnet-4-6',
      },
    ],
    openAiCompatTest: {
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'openrouter/auto',
    },
  },
  {
    id: 'together',
    displayName: 'Together AI',
    envKey: 'TOGETHER_API_KEY',
    uiGroup: 'ai-provider',
    category: 'proxy',
    openclawProviderId: 'together',
    defaultModel: 'together/meta-llama/Llama-3.3-70B-Instruct-Turbo',
    modelRefHint: 'together/<model-id>',
    apiKeyUrl: 'https://api.together.ai/settings/api-keys',
    docsUrl: 'https://docs.together.ai/',
    starterModels: [
      {
        id: 'llama-3.3-70b',
        name: 'Llama 3.3 70B Instruct Turbo',
        openclawId: 'together/meta-llama/Llama-3.3-70B-Instruct-Turbo',
        recommended: true,
      },
      {
        id: 'kimi-k2.5',
        name: 'Kimi K2.5',
        openclawId: 'together/moonshotai/Kimi-K2.5',
      },
    ],
    openAiCompatTest: {
      baseUrl: 'https://api.together.xyz/v1',
      model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    },
  },
  {
    id: 'vercel-ai-gateway',
    displayName: 'Vercel AI',
    envKey: 'AI_GATEWAY_API_KEY',
    uiGroup: 'ai-provider',
    category: 'proxy',
    openclawProviderId: 'vercel-ai-gateway',
    defaultModel: 'vercel-ai-gateway/anthropic/claude-opus-4-8',
    modelRefHint: 'vercel-ai-gateway/<vendor>/<model>',
    apiKeyUrl: 'https://vercel.com/docs/ai-gateway',
    docsUrl: 'https://vercel.com/docs/ai-gateway',
    starterModels: [
      {
        id: 'claude-opus',
        name: 'Claude Opus (via Vercel AI Gateway)',
        openclawId: 'vercel-ai-gateway/anthropic/claude-opus-4-8',
        recommended: true,
      },
      {
        id: 'gpt-5.5',
        name: 'GPT-5.5 (via Vercel AI Gateway)',
        openclawId: 'vercel-ai-gateway/openai/gpt-5.5',
      },
    ],
    openAiCompatTest: {
      baseUrl: 'https://ai-gateway.vercel.sh/v1',
      model: 'anthropic/claude-sonnet-4-6',
    },
  },
  {
    id: 'kilocode',
    displayName: 'Kilo',
    envKey: 'KILOCODE_API_KEY',
    uiGroup: 'ai-provider',
    category: 'proxy',
    openclawProviderId: 'kilocode',
    defaultModel: 'kilocode/kilo/auto',
    modelRefHint: 'kilocode/<model-id>',
    apiKeyUrl: 'https://app.kilo.ai',
    docsUrl: 'https://kilo.ai/docs',
    starterModels: [
      {
        id: 'kilo-auto',
        name: 'Kilo Auto',
        openclawId: 'kilocode/kilo/auto',
        recommended: true,
      },
    ],
    openAiCompatTest: {
      baseUrl: 'https://api.kilo.ai/api/gateway',
      model: 'kilo/auto',
    },
  },
];

const byId = new Map(PROVIDER_REGISTRY.map((p) => [p.id, p]));
const byEnvKey = new Map(PROVIDER_REGISTRY.map((p) => [p.envKey, p]));

export function resolveProvider(
  idOrEnvKey: string,
): ProviderDefinition | undefined {
  const key = idOrEnvKey.trim();
  return byId.get(key) ?? byEnvKey.get(key);
}

export function envKeyForProvider(providerId: string): string | undefined {
  return resolveProvider(providerId)?.envKey;
}

export function openclawProviderPrefix(provider: ProviderDefinition): string {
  return provider.openclawProviderId ?? provider.id;
}

export function collectFoundationAllowlist(
  enabledProviderIds: Set<string>,
): string[] {
  const ids: string[] = [];
  for (const def of PROVIDER_REGISTRY) {
    if (def.uiGroup !== 'foundation' || !enabledProviderIds.has(def.id))
      continue;
    for (const model of def.models ?? []) {
      ids.push(model.openclawId);
    }
    if (def.defaultModel && !ids.includes(def.defaultModel)) {
      ids.push(def.defaultModel);
    }
  }
  return ids;
}

export function collectFoundationProviderModelsSync(
  enabledProviderIds: Set<string>,
  apiKeyByProviderId?: ReadonlyMap<string, string>,
): Array<{
  openclawProviderId: string;
  models: Array<{ id: string; name: string }>;
  openAiCompat?: { baseUrl: string; api?: string };
  apiKey?: string;
}> {
  const entries: Array<{
    openclawProviderId: string;
    models: Array<{ id: string; name: string }>;
    openAiCompat?: { baseUrl: string; api?: string };
    apiKey?: string;
  }> = [];

  for (const def of PROVIDER_REGISTRY) {
    if (def.uiGroup !== 'foundation' || !enabledProviderIds.has(def.id)) {
      continue;
    }
    const models = (def.models ?? []).map((model) => ({
      id: model.id,
      name: model.name,
    }));
    if (models.length === 0) continue;

    entries.push({
      openclawProviderId: def.openclawProviderId ?? def.id,
      models,
      openAiCompat: def.openAiCompatTest
        ? {
            baseUrl: def.openAiCompatTest.baseUrl,
            api: 'openai-completions',
          }
        : undefined,
      apiKey: apiKeyByProviderId?.get(def.id),
    });
  }

  return entries;
}
