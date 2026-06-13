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
  { id: 'claude-opus-4-5', name: 'Claude Opus 4.5', openclawId: 'anthropic/claude-opus-4-5' },
  {
    id: 'claude-sonnet-4-5',
    name: 'Claude Sonnet 4.5',
    openclawId: 'anthropic/claude-sonnet-4-5',
    recommended: true,
  },
  { id: 'claude-haiku-3-5', name: 'Claude Haiku 3.5', openclawId: 'anthropic/claude-haiku-3-5' },
] satisfies ProviderDefinition['models'];

const DEEPSEEK_MODELS = [
  { id: 'deepseek-v3', name: 'DeepSeek V3', openclawId: 'deepseek/deepseek-v3' },
  { id: 'deepseek-r1', name: 'DeepSeek R1', openclawId: 'deepseek/deepseek-r1' },
] satisfies ProviderDefinition['models'];

const GROQ_MODELS = [
  { id: 'llama-3.1-70b', name: 'Llama 3.1 70B', openclawId: 'groq/llama-3.1-70b' },
  { id: 'mixtral-8x7b', name: 'Mixtral 8x7B', openclawId: 'groq/mixtral-8x7b' },
] satisfies ProviderDefinition['models'];

const MISTRAL_MODELS = [
  {
    id: 'mistral-large',
    name: 'Mistral Large',
    openclawId: 'mistral/mistral-large',
  },
  { id: 'codestral', name: 'Codestral', openclawId: 'mistral/codestral' },
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
    defaultModel: 'anthropic/claude-sonnet-4-5',
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
    defaultModel: 'deepseek/deepseek-v3',
    apiKeyUrl: 'https://platform.deepseek.com/api_keys',
    models: DEEPSEEK_MODELS,
  },
  {
    id: 'groq',
    displayName: 'Groq',
    envKey: 'GROQ_API_KEY',
    uiGroup: 'foundation',
    category: 'direct',
    defaultModel: 'groq/llama-3.1-70b',
    apiKeyUrl: 'https://console.groq.com/keys',
    models: GROQ_MODELS,
  },
  {
    id: 'mistral',
    displayName: 'Mistral',
    envKey: 'MISTRAL_API_KEY',
    uiGroup: 'foundation',
    category: 'direct',
    defaultModel: 'mistral/mistral-large',
    apiKeyUrl: 'https://console.mistral.ai/api-keys/',
    models: MISTRAL_MODELS,
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
      { id: 'auto', name: 'Auto routing', openclawId: 'openrouter/auto', recommended: true },
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
    defaultModel: 'vercel-ai-gateway/anthropic/claude-opus-4-6',
    modelRefHint: 'vercel-ai-gateway/<vendor>/<model>',
    apiKeyUrl: 'https://vercel.com/docs/ai-gateway',
    docsUrl: 'https://vercel.com/docs/ai-gateway',
    starterModels: [
      {
        id: 'claude-opus',
        name: 'Claude Opus (via Vercel AI Gateway)',
        openclawId: 'vercel-ai-gateway/anthropic/claude-opus-4-6',
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
      { id: 'kilo-auto', name: 'Kilo Auto', openclawId: 'kilocode/kilo/auto', recommended: true },
    ],
    openAiCompatTest: {
      baseUrl: 'https://api.kilo.ai/api/gateway',
      model: 'kilo/auto',
    },
  },
];

const byId = new Map(PROVIDER_REGISTRY.map((p) => [p.id, p]));
const byEnvKey = new Map(PROVIDER_REGISTRY.map((p) => [p.envKey, p]));

export function resolveProvider(idOrEnvKey: string): ProviderDefinition | undefined {
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
    if (def.uiGroup !== 'foundation' || !enabledProviderIds.has(def.id)) continue;
    for (const model of def.models ?? []) {
      ids.push(model.openclawId);
    }
    if (def.defaultModel && !ids.includes(def.defaultModel)) {
      ids.push(def.defaultModel);
    }
  }
  return ids;
}
