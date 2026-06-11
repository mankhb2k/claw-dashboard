/**
 * Catalog UI — giữ đồng bộ với backend `ai-providers/openai/openai-models.ts`.
 * Nguồn: https://developers.openai.com/api/docs/models
 */
export type OpenAiModelTier = 'stable' | 'preview' | 'deprecated';

export type OpenAiModelDef = {
  id: string;
  name: string;
  openclawId: string;
  tier: OpenAiModelTier;
  description?: string;
  recommended?: boolean;
};

export const OPENAI_CHAT_MODELS: OpenAiModelDef[] = [
  {
    id: 'gpt-5.5',
    name: 'GPT-5.5',
    openclawId: 'openai/gpt-5.5',
    tier: 'stable',
    description: 'Flagship — coding, agent, suy luận phức tạp',
  },
  {
    id: 'gpt-5.4',
    name: 'GPT-5.4',
    openclawId: 'openai/gpt-5.4',
    tier: 'stable',
    description: 'Cân bằng hiệu năng / chi phí',
  },
  {
    id: 'gpt-5.4-mini',
    name: 'GPT-5.4 Mini',
    openclawId: 'openai/gpt-5.4-mini',
    tier: 'stable',
    recommended: true,
    description: 'Nhanh, rẻ — mặc định test key',
  },
  {
    id: 'gpt-5.4-nano',
    name: 'GPT-5.4 Nano',
    openclawId: 'openai/gpt-5.4-nano',
    tier: 'stable',
    description: 'Latency thấp, chi phí tối thiểu',
  },
];

export const OPENAI_DEFAULT_OPENCLAW_MODEL =
  OPENAI_CHAT_MODELS.find((m) => m.id === 'gpt-5.4-mini')?.openclawId ??
  'openai/gpt-5.4-mini';

export function openAiModelsToProviderModels() {
  return OPENAI_CHAT_MODELS.map((m) => ({
    id: m.id,
    name: m.name,
    openclawId: m.openclawId,
    tier: m.tier,
    description: m.description,
    recommended: m.recommended,
  }));
}
