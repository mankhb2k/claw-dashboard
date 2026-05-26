/** Catalog Gemini model for agent/chat (generateContent). Source: ai.google.dev/gemini-api/docs/models */
export type GeminiModelTier = 'stable' | 'preview' | 'deprecated';

export type GeminiModelDef = {
  /** ID call Gemini API, e.g. gemini-2.5-flash */
  id: string;
  name: string;
  /** ID OpenClaw: google/{id} */
  openclawId: string;
  tier: GeminiModelTier;
  description?: string;
  recommended?: boolean;
  isFree?: boolean;
};

export const GEMINI_OPENCLAW_PROVIDER = 'google';

export const GEMINI_CHAT_MODELS: GeminiModelDef[] = [
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    openclawId: 'google/gemini-3.5-flash',
    tier: 'stable',
    recommended: true,
    description: 'Latest — agent & coding, high performance',
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    openclawId: 'google/gemini-3.1-pro-preview',
    tier: 'preview',
    description: 'Preview — complex reasoning, agentic',
  },
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    openclawId: 'google/gemini-3-flash-preview',
    tier: 'preview',
    description: 'Preview — balance cost/performance',
  },
  {
    id: 'gemini-3.1-flash-lite-preview',
    name: 'Gemini 3.1 Flash-Lite',
    openclawId: 'google/gemini-3.1-flash-lite-preview',
    tier: 'preview',
    description: 'Preview — cheap, low latency',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    openclawId: 'google/gemini-2.5-pro',
    tier: 'stable',
    description: 'Reasoning deep, complex coding',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    openclawId: 'google/gemini-2.5-flash',
    tier: 'stable',
    description: 'Balance cost/performance — default SaaS',
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash-Lite',
    openclawId: 'google/gemini-2.5-flash-lite',
    tier: 'stable',
    isFree: true,
    description: 'Fastest, cheapest in 2.5 line',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    openclawId: 'google/gemini-2.0-flash',
    tier: 'deprecated',
    description: 'Deprecated — migrate to 2.5/3.x',
  },
  {
    id: 'gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash-Lite',
    openclawId: 'google/gemini-2.0-flash-lite',
    tier: 'deprecated',
    description: 'Deprecated — migrate to 2.5 Flash-Lite',
  },
];

export const GEMINI_DEFAULT_OPENCLAW_MODEL =
  GEMINI_CHAT_MODELS.find((m) => m.id === 'gemini-2.5-flash')?.openclawId ??
  'google/gemini-2.5-flash';

/** Skill AI editor — 3 latest models in 3.x line (first in catalog). */
export const GEMINI_SKILL_AI_EDITOR_MODEL_IDS = [
  'gemini-3.5-flash',
  'gemini-3.1-pro-preview',
  'gemini-3-flash-preview',
] as const;

export const GEMINI_SKILL_AI_EDITOR_MODELS = GEMINI_CHAT_MODELS.filter((m) =>
  (GEMINI_SKILL_AI_EDITOR_MODEL_IDS as readonly string[]).includes(m.id),
);

export const GEMINI_DEFAULT_SKILL_OPENCLAW_MODEL =
  GEMINI_SKILL_AI_EDITOR_MODELS.find((m) => m.id === 'gemini-3.5-flash')
    ?.openclawId ?? 'google/gemini-3.5-flash';

export function isGeminiSkillAiEditorModelId(
  modelOrOpenclawId: string,
): boolean {
  const native = modelOrOpenclawId.includes('/')
    ? modelOrOpenclawId.split('/').pop()!
    : modelOrOpenclawId;
  return (GEMINI_SKILL_AI_EDITOR_MODEL_IDS as readonly string[]).includes(
    native,
  );
}

export function resolveGeminiSkillDefaultModel(
  storedDefault: string | null,
): string {
  if (storedDefault && isGeminiSkillAiEditorModelId(storedDefault)) {
    return storedDefault;
  }
  return GEMINI_DEFAULT_SKILL_OPENCLAW_MODEL;
}
