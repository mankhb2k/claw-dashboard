import {
  GEMINI_DEFAULT_OPENCLAW_MODEL,
  GEMINI_OPENCLAW_PROVIDER,
  toGeminiProviderModelEntries,
  OPENAI_DEFAULT_OPENCLAW_MODEL,
  toOpenAiProviderModelEntries,
} from '@aucobot/shared'

export type ModelTier = 'stable' | 'preview' | 'deprecated'

export interface ModelDef {
  id: string
  name: string
  /** OpenClaw full id, e.g. google/gemini-2.5-flash */
  openclawId?: string
  tier?: ModelTier
  description?: string
  recommended?: boolean
  isFree?: boolean
}

export interface CatalogSource {
  href: string
  label: string
  note: string
}

export interface ProviderData {
  id: string
  name: string
  icon: string
  color: string
  envKey?: string
  iconSrc?: string
  /** OpenClaw provider prefix (Gemini → google). */
  openclawProviderId?: string
  models?: ModelDef[]
  /** Official provider model catalog reference link. */
  catalogSource?: CatalogSource
  /** Provider page to create or manage API keys. */
  apiKeyUrl?: string
  /** API key link label (default: "Get API key"). */
  apiKeyLabel?: string
}

export const APIKEY_PROVIDERS: ProviderData[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    icon: 'auto_awesome',
    iconSrc: '/models-icon/ChatGPT-icon.svg',
    color: '#10A37F',
    envKey: 'OPENAI_API_KEY',
    models: toOpenAiProviderModelEntries(),
    catalogSource: {
      href: 'https://developers.openai.com/api/docs/models',
      label: 'OpenAI API',
      note: 'GPT-5 frontier chat/agent models (excludes image, realtime, TTS).',
    },
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    apiKeyLabel: 'Get OpenAI API key',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: 'smart_toy',
    iconSrc: '/models-icon/Claude-icon.svg',
    color: '#D97757',
    envKey: 'ANTHROPIC_API_KEY',
    models: [
      { id: 'claude-opus-4-5', name: 'Claude Opus 4.5' },
      { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5' },
      { id: 'claude-haiku-3-5', name: 'Claude Haiku 3.5' },
    ],
    apiKeyUrl: 'https://console.anthropic.com/settings/keys',
    apiKeyLabel: 'Get Anthropic API key',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: 'diamond',
    iconSrc: '/models-icon/Gemini-icon.svg',
    color: '#4285F4',
    envKey: 'GEMINI_API_KEY',
    openclawProviderId: GEMINI_OPENCLAW_PROVIDER,
    models: toGeminiProviderModelEntries(),
    catalogSource: {
      href: 'https://ai.google.dev/gemini-api/docs/models',
      label: 'Google Gemini API',
      note: 'Chat/agent models only (excludes TTS, image, video, Live).',
    },
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: 'bolt',
    iconSrc: '/models-icon/DeepSeek-icon.svg',
    color: '#4D6BFE',
    envKey: 'DEEPSEEK_API_KEY',
    models: [
      { id: 'deepseek-v3', name: 'DeepSeek V3' },
      { id: 'deepseek-r1', name: 'DeepSeek R1' },
    ],
    apiKeyUrl: 'https://platform.deepseek.com/api_keys',
    apiKeyLabel: 'Get DeepSeek API key',
  },
  {
    id: 'groq',
    name: 'Groq',
    icon: 'speed',
    iconSrc: '/models-icon/Grok-icon.svg',
    color: '#F55036',
    envKey: 'GROQ_API_KEY',
    models: [
      { id: 'llama-3.1-70b', name: 'Llama 3.1 70B' },
      { id: 'mixtral-8x7b', name: 'Mixtral 8x7B' },
    ],
    apiKeyUrl: 'https://console.groq.com/keys',
    apiKeyLabel: 'Get Groq API key',
  },
  {
    id: 'mistral',
    name: 'Mistral',
    icon: 'air',
    iconSrc: '/models-icon/Mistral-icon.svg',
    color: '#FF7000',
    envKey: 'MISTRAL_API_KEY',
    models: [
      { id: 'mistral-large', name: 'Mistral Large' },
      { id: 'codestral', name: 'Codestral' },
    ],
    apiKeyUrl: 'https://console.mistral.ai/api-keys/',
    apiKeyLabel: 'Get Mistral API key',
  },
]

export { GEMINI_DEFAULT_OPENCLAW_MODEL, OPENAI_DEFAULT_OPENCLAW_MODEL }

/** Phase 1 fixed card order — foundation then AI provider proxies. */
export const PHASE1_FOUNDATION_IDS = [
  'openai',
  'anthropic',
  'gemini',
  'deepseek',
  'groq',
  'mistral',
] as const

export const PHASE1_AI_PROVIDER_IDS = [
  'openrouter',
  'together',
  'vercel-ai-gateway',
  'kilocode',
] as const

export const PHASE1_PROVIDER_IDS = [
  ...PHASE1_FOUNDATION_IDS,
  ...PHASE1_AI_PROVIDER_IDS,
] as const

export type Phase1ProviderId = (typeof PHASE1_PROVIDER_IDS)[number]

export type ProviderUiMetadata = Pick<
  ProviderData,
  'icon' | 'color' | 'iconSrc' | 'apiKeyUrl' | 'apiKeyLabel' | 'catalogSource'
>

const AI_PROVIDER_UI: Record<string, ProviderUiMetadata> = {
  openrouter: {
    icon: 'hub',
    color: '#6366F1',
    apiKeyUrl: 'https://openrouter.ai/keys',
    apiKeyLabel: 'Get OpenRouter API key',
  },
  together: {
    icon: 'groups',
    color: '#0EA5E9',
    apiKeyUrl: 'https://api.together.ai/settings/api-keys',
    apiKeyLabel: 'Get Together API key',
  },
  'vercel-ai-gateway': {
    icon: 'cloud',
    color: '#000000',
    apiKeyUrl: 'https://vercel.com/docs/ai-gateway',
    apiKeyLabel: 'Get Vercel AI Gateway key',
  },
  kilocode: {
    icon: 'bolt',
    color: '#8B5CF6',
    apiKeyUrl: 'https://app.kilo.ai',
    apiKeyLabel: 'Get Kilo API key',
  },
}

export function getProviderUiMetadata(
  providerId: string,
): ProviderUiMetadata | undefined {
  const foundation = APIKEY_PROVIDERS.find((p) => p.id === providerId)
  if (foundation) {
    return {
      icon: foundation.icon,
      color: foundation.color,
      iconSrc: foundation.iconSrc,
      apiKeyUrl: foundation.apiKeyUrl,
      apiKeyLabel: foundation.apiKeyLabel,
      catalogSource: foundation.catalogSource,
    }
  }
  return AI_PROVIDER_UI[providerId]
}

export function isPhase1ProviderId(
  providerId: string,
): providerId is Phase1ProviderId {
  return (PHASE1_PROVIDER_IDS as readonly string[]).includes(providerId)
}

export function getProviderById(providerId: string): ProviderData | undefined {
  return APIKEY_PROVIDERS.find((p) => p.id === providerId)
}

export function getCatalogSource(
  providerId: string,
): CatalogSource | undefined {
  return getProviderById(providerId)?.catalogSource
}
