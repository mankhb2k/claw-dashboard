import { GeminiAgentProvider } from './gemini-agent.provider';
import { OpenAiAgentProvider } from './openai-agent.provider';

import type { AgentAiEditorProviderId } from '../lib/agent-ai-editor.constants';
import type { AgentAiEditorProviderAdapter } from '../lib/agent-ai-editor.types';

const adapters: AgentAiEditorProviderAdapter[] = [
  new GeminiAgentProvider(),
  new OpenAiAgentProvider(),
];

const byId = new Map(adapters.map((a) => [a.id, a]));

export function getAgentAiEditorAdapter(
  providerId: string,
): AgentAiEditorProviderAdapter | undefined {
  return byId.get(providerId.trim());
}

export function isAgentAiEditorProviderSupported(
  providerId: string,
): providerId is AgentAiEditorProviderId {
  return byId.has(providerId.trim());
}

export function listAgentAiEditorAdapterIds(): string[] {
  return [...byId.keys()];
}
