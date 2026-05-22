import { GEMINI_CHAT_MODELS, GEMINI_DEFAULT_OPENCLAW_MODEL, GEMINI_OPENCLAW_PROVIDER } from './gemini-models';
import { OPENAI_CHAT_MODELS, OPENAI_DEFAULT_OPENCLAW_MODEL } from './openai-models';

export type ProviderModelCatalogEntry = {
  id: string;
  name: string;
  openclawId: string;
  tier?: string;
  description?: string;
  recommended?: boolean;
  isFree?: boolean;
};

export type ProviderDefinition = {
  id: string;
  displayName: string;
  envKey: string;
  /** OpenClaw provider prefix (Gemini → `google`). */
  openclawProviderId?: string;
  /** OpenClaw model id, e.g. google/gemini-2.5-flash */
  defaultModel?: string;
  /** Catalog model cho UI — không lưu DB. */
  models?: ProviderModelCatalogEntry[];
};

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
