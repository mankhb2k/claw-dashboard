export type ProviderUiGroup = 'foundation' | 'ai-provider';
export type ProviderCategory = 'direct' | 'proxy';

export type ProviderModelCatalogEntry = {
  id: string;
  name: string;
  openclawId: string;
  tier?: string;
  description?: string;
  recommended?: boolean;
  isFree?: boolean;
};

export type ProviderOpenAiCompatTestConfig = {
  baseUrl: string;
  model: string;
};

export type ProviderDefinition = {
  id: string;
  displayName: string;
  envKey: string;
  uiGroup: ProviderUiGroup;
  category: ProviderCategory;
  /** OpenClaw provider prefix (Gemini → `google`). */
  openclawProviderId?: string;
  /** OpenClaw model id, e.g. google/gemini-2.5-flash */
  defaultModel?: string;
  modelRefHint?: string;
  apiKeyUrl?: string;
  docsUrl?: string;
  /** Catalog model cho UI — không lưu DB. */
  models?: ProviderModelCatalogEntry[];
  /** Proxy quick-start entries (not full catalog). */
  starterModels?: ProviderModelCatalogEntry[];
  openAiCompatTest?: ProviderOpenAiCompatTestConfig;
};
