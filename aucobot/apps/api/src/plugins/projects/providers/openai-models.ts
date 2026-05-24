/** Catalog chat/agent OpenAI — nguồn: https://developers.openai.com/api/docs/models */
export type OpenAiModelTier = 'stable' | 'preview' | 'deprecated';

export type OpenAiModelDef = {
  id: string;
  name: string;
  openclawId: string;
  tier: OpenAiModelTier;
  description?: string;
  recommended?: boolean;
  /** Chỉ hiện trong Skill AI assistant (GPT-5 frontier). */
  skillAssistant?: boolean;
};

export const OPENAI_CHAT_MODELS: OpenAiModelDef[] = [
  {
    id: 'gpt-5.5',
    name: 'GPT-5.5',
    openclawId: 'openai/gpt-5.5',
    tier: 'stable',
    description: 'Flagship — coding, agent, suy luận phức tạp',
    skillAssistant: true,
  },
  {
    id: 'gpt-5.4',
    name: 'GPT-5.4',
    openclawId: 'openai/gpt-5.4',
    tier: 'stable',
    description: 'Cân bằng hiệu năng / chi phí',
    skillAssistant: true,
  },
  {
    id: 'gpt-5.4-mini',
    name: 'GPT-5.4 Mini',
    openclawId: 'openai/gpt-5.4-mini',
    tier: 'stable',
    recommended: true,
    description: 'Nhanh, rẻ — mặc định test key & agent nhẹ',
    skillAssistant: true,
  },
  {
    id: 'gpt-5.4-nano',
    name: 'GPT-5.4 Nano',
    openclawId: 'openai/gpt-5.4-nano',
    tier: 'stable',
    description: 'Latency thấp, chi phí tối thiểu',
    skillAssistant: true,
  },
];

export const OPENAI_DEFAULT_OPENCLAW_MODEL =
  OPENAI_CHAT_MODELS.find((m) => m.id === 'gpt-5.4-mini')?.openclawId ??
  'openai/gpt-5.4-mini';

/** Model GPT-5 dùng cho Skill AI assistant dropdown. */
export const OPENAI_SKILL_ASSISTANT_MODELS = OPENAI_CHAT_MODELS.filter(
  (m) => m.skillAssistant === true,
);

export function isOpenAiSkillAssistantModelId(modelOrOpenclawId: string): boolean {
  const native = modelOrOpenclawId.includes('/')
    ? modelOrOpenclawId.split('/').pop()!
    : modelOrOpenclawId;
  return native.startsWith('gpt-5');
}

export function resolveOpenAiSkillDefaultModel(storedDefault: string | null): string {
  if (storedDefault && isOpenAiSkillAssistantModelId(storedDefault)) {
    return storedDefault;
  }
  return OPENAI_DEFAULT_OPENCLAW_MODEL;
}
