import type { SkillAssistantProviderId } from '../skill-assistant.constants';
import type { SkillAssistantProviderAdapter } from '../skill-assistant.types';
import { GeminiAssistantProvider } from './gemini-assistant.provider';
import { OpenAiAssistantProvider } from './openai-assistant.provider';

const adapters: SkillAssistantProviderAdapter[] = [
  new GeminiAssistantProvider(),
  new OpenAiAssistantProvider(),
];

const byId = new Map(adapters.map((a) => [a.id, a]));

export function getSkillAssistantAdapter(
  providerId: string,
): SkillAssistantProviderAdapter | undefined {
  return byId.get(providerId.trim());
}

export function isSkillAssistantProviderSupported(
  providerId: string,
): providerId is SkillAssistantProviderId {
  return byId.has(providerId.trim());
}

export function listSkillAssistantAdapterIds(): string[] {
  return [...byId.keys()];
}
