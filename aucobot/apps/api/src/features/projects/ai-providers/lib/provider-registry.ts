import {
  GEMINI_CHAT_MODELS,
  GEMINI_DEFAULT_OPENCLAW_MODEL,
  GEMINI_OPENCLAW_PROVIDER,
  OPENAI_CHAT_MODELS,
  OPENAI_DEFAULT_OPENCLAW_MODEL,
} from '@aucobot/shared';
import type { ProviderDefinition } from './provider-registry.types';

export type { ProviderDefinition, ProviderModelCatalogEntry } from './provider-registry.types';

export const PROVIDER_REGISTRY: ProviderDefinition[] = [
  {
    id: 'openai',
    displayName: 'OpenAI',
    envKey: 'OPENAI_API_KEY',
    defaultModel: OPENAI_DEFAULT_OPENCLAW_MODEL,
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
    displayName: 'Anthropic',
    envKey: 'ANTHROPIC_API_KEY',
    defaultModel: 'anthropic/claude-sonnet-4-6',
  },
  {
    id: 'gemini',
    displayName: 'Google Gemini',
    envKey: 'GEMINI_API_KEY',
    openclawProviderId: GEMINI_OPENCLAW_PROVIDER,
    defaultModel: GEMINI_DEFAULT_OPENCLAW_MODEL,
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
  { id: 'openrouter', displayName: 'OpenRouter', envKey: 'OPENROUTER_API_KEY' },
  { id: 'google', displayName: 'Google', envKey: 'GOOGLE_API_KEY' },
  { id: 'deepseek', displayName: 'DeepSeek', envKey: 'DEEPSEEK_API_KEY' },
  { id: 'groq', displayName: 'Groq', envKey: 'GROQ_API_KEY' },
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
