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

export type OpenAiProviderModelEntry = {
  id: string;
  name: string;
  openclawId: string;
  tier: OpenAiModelTier;
  description?: string;
  recommended?: boolean;
};
