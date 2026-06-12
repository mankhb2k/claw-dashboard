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
