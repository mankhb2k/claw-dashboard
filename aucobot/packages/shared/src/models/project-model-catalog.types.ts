export type ChatModelOption = {
  id: string;
  name: string;
  openclawId: string;
};

export type ChatModelProviderGroup = {
  providerId: string;
  displayName: string;
  defaultModel: string | null;
  tested: boolean;
  models: ChatModelOption[];
};

export type ProjectModelCatalogProviders = {
  providers: ChatModelProviderGroup[];
};
