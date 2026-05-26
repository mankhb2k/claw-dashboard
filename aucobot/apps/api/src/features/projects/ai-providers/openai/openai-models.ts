/** Catalog chat/agent OpenAI — source: https://developers.openai.com/api/docs/models */
export type OpenAiModelTier = 'stable' | 'preview' | 'deprecated';

export type OpenAiModelDef = {
  id: string;
  name: string;
  openclawId: string;
  tier: OpenAiModelTier;
  description?: string;
  recommended?: boolean;
  /** Only show in skill AI editor (GPT-5 frontier). */
  skillAiEditor?: boolean;
};

export const OPENAI_CHAT_MODELS: OpenAiModelDef[] = [
  {
    id: 'gpt-5.5',
    name: 'GPT-5.5',
    openclawId: 'openai/gpt-5.5',
    tier: 'stable',
    description: 'Flagship — coding, agent, complex reasoning',
    skillAiEditor: true,
  },
  {
    id: 'gpt-5.4',
    name: 'GPT-5.4',
    openclawId: 'openai/gpt-5.4',
    tier: 'stable',
    description: 'Balance performance / cost',
    skillAiEditor: true,
  },
  {
    id: 'gpt-5.4-mini',
    name: 'GPT-5.4 Mini',
    openclawId: 'openai/gpt-5.4-mini',
    tier: 'stable',
    recommended: true,
    description: 'Fast, cheap — default test key & agent lightweight',
    skillAiEditor: true,
  },
  {
    id: 'gpt-5.4-nano',
    name: 'GPT-5.4 Nano',
    openclawId: 'openai/gpt-5.4-nano',
    tier: 'stable',
    description: 'Low latency, minimum cost',
    skillAiEditor: true,
  },
];

export const OPENAI_DEFAULT_OPENCLAW_MODEL =
  OPENAI_CHAT_MODELS.find((m) => m.id === 'gpt-5.4-mini')?.openclawId ??
  'openai/gpt-5.4-mini';

/** Model GPT-5 for skill AI editor dropdown. */
export const OPENAI_SKILL_AI_EDITOR_MODELS = OPENAI_CHAT_MODELS.filter(
  (m) => m.skillAiEditor === true,
);

export function isOpenAiSkillAiEditorModelId(
  modelOrOpenclawId: string,
): boolean {
  const native = modelOrOpenclawId.includes('/')
    ? modelOrOpenclawId.split('/').pop()!
    : modelOrOpenclawId;
  return native.startsWith('gpt-5');
}

export function resolveOpenAiSkillDefaultModel(
  storedDefault: string | null,
): string {
  if (storedDefault && isOpenAiSkillAiEditorModelId(storedDefault)) {
    return storedDefault;
  }
  return OPENAI_DEFAULT_OPENCLAW_MODEL;
}
