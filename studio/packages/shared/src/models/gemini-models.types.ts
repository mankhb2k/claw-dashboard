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

export type GeminiProviderModelEntry = {
  id: string;
  name: string;
  openclawId: string;
  tier: GeminiModelTier;
  description?: string;
  recommended?: boolean;
  isFree?: boolean;
};
