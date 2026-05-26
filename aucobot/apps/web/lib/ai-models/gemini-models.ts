/**
 * Catalog UI — giữ đồng bộ với backend `ai-providers/gemini/gemini-models.ts`.
 * Nguồn: https://ai.google.dev/gemini-api/docs/models
 */
export type GeminiModelTier = 'stable' | 'preview' | 'deprecated';

export type GeminiModelDef = {
  id: string;
  name: string;
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
    description: 'Mới nhất — agent & coding, hiệu năng cao',
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    openclawId: 'google/gemini-3.1-pro-preview',
    tier: 'preview',
    description: 'Preview — suy luận phức tạp, agentic',
  },
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    openclawId: 'google/gemini-3-flash-preview',
    tier: 'preview',
    description: 'Preview — cân bằng chi phí/hiệu năng',
  },
  {
    id: 'gemini-3.1-flash-lite-preview',
    name: 'Gemini 3.1 Flash-Lite',
    openclawId: 'google/gemini-3.1-flash-lite-preview',
    tier: 'preview',
    description: 'Preview — rẻ, latency thấp',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    openclawId: 'google/gemini-2.5-pro',
    tier: 'stable',
    description: 'Suy luận sâu, coding phức tạp',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    openclawId: 'google/gemini-2.5-flash',
    tier: 'stable',
    description: 'Cân bằng giá/hiệu năng — mặc định SaaS',
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash-Lite',
    openclawId: 'google/gemini-2.5-flash-lite',
    tier: 'stable',
    isFree: true,
    description: 'Nhanh nhất, tiết kiệm nhất trong dòng 2.5',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    openclawId: 'google/gemini-2.0-flash',
    tier: 'deprecated',
    description: 'Deprecated — migrate sang 2.5/3.x',
  },
  {
    id: 'gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash-Lite',
    openclawId: 'google/gemini-2.0-flash-lite',
    tier: 'deprecated',
    description: 'Deprecated — migrate sang 2.5 Flash-Lite',
  },
];

export const GEMINI_DEFAULT_OPENCLAW_MODEL =
  GEMINI_CHAT_MODELS.find((m) => m.id === 'gemini-2.5-flash')?.openclawId ??
  'google/gemini-2.5-flash';

export function geminiModelsToProviderModels() {
  return GEMINI_CHAT_MODELS.map((m) => ({
    id: m.id,
    name: m.name,
    openclawId: m.openclawId,
    tier: m.tier,
    description: m.description,
    recommended: m.recommended,
    isFree: m.isFree,
  }));
}
