export type SkillAssistantMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type SkillAssistantCompleteInput = {
  apiKey: string;
  model: string;
  system: string;
  messages: SkillAssistantMessage[];
};

export type SkillAssistantCompleteResult = {
  markdown: string;
};

export interface SkillAssistantProviderAdapter {
  readonly id: string;
  complete(input: SkillAssistantCompleteInput): Promise<SkillAssistantCompleteResult>;
}
