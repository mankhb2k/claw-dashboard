export type SkillAiEditorMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type SkillAiEditorCompleteInput = {
  apiKey: string;
  model: string;
  system: string;
  messages: SkillAiEditorMessage[];
};

export type SkillAiEditorCompleteResult = {
  markdown: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
};

export interface SkillAiEditorProviderAdapter {
  readonly id: string;
  complete(
    input: SkillAiEditorCompleteInput,
  ): Promise<SkillAiEditorCompleteResult>;
}
