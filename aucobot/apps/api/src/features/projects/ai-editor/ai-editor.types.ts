export type LlmCompleteResult = {
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
};

export type EditorOptionModel = {
  id: string;
  name: string;
  openclawId: string;
};

export type EditorOptionProvider = {
  providerId: string;
  displayName: string;
  defaultModel: string | null;
  models: EditorOptionModel[];
};
