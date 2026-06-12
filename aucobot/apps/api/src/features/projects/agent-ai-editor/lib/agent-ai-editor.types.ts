export type AgentAiEditorMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type AgentAiEditorCompleteInput = {
  apiKey: string;
  model: string;
  system: string;
  messages: AgentAiEditorMessage[];
};

export type LlmCompleteResult = {
  text: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
};

export interface AgentAiEditorProviderAdapter {
  readonly id: string;
  complete(input: AgentAiEditorCompleteInput): Promise<LlmCompleteResult>;
}

export type AgentAiEditorCompletePhase = 'clarify' | 'optimize';

export type AgentAiEditorCompleteResult = {
  phase: AgentAiEditorCompletePhase;
  message: string;
  questions?: string[];
  markdown?: string;
};

export type AgentContextForPrompt = {
  name: string;
  description: string;
  vibe: string;
  tags: string[];
  instructionsMode: 'simple' | 'advanced';
  currentAgentsMd: string;
  activeEditTab?: string;
  instructionsRole?: string;
  instructionsRules?: string;
  instructionsConstraints?: string;
  instructionsOutputFormat?: string;
};
