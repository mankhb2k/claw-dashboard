import type { SkillAiEditorProviderId } from '../skill-ai-editor.constants';
import type { SkillAiEditorProviderAdapter } from '../skill-ai-editor.types';
import { GeminiAssistantProvider } from './gemini-assistant.provider';
import { OpenAiAssistantProvider } from './openai-assistant.provider';

const adapters: SkillAiEditorProviderAdapter[] = [
  new GeminiAssistantProvider(),
  new OpenAiAssistantProvider(),
];

const byId = new Map(adapters.map((a) => [a.id, a]));

export function getSkillAiEditorAdapter(
  providerId: string,
): SkillAiEditorProviderAdapter | undefined {
  return byId.get(providerId.trim());
}

export function isSkillAiEditorProviderSupported(
  providerId: string,
): providerId is SkillAiEditorProviderId {
  return byId.has(providerId.trim());
}

export function listSkillAiEditorAdapterIds(): string[] {
  return [...byId.keys()];
}
