import type { GeminiApiKeySmokeResult } from '../adapters/gemini/gemini-test-key.types';
import { smokeTestGeminiApiKey } from '../adapters/gemini/gemini-test-key';
import type { OpenAiApiKeySmokeResult } from '../adapters/openai/openai-test-key.types';
import { smokeTestOpenAiApiKey } from '../adapters/openai/openai-test-key';
import { resolveProvider } from './provider-registry';

export type ProviderApiKeySmokeResult =
  | GeminiApiKeySmokeResult
  | OpenAiApiKeySmokeResult;
/** @deprecated Use ProviderApiKeySmokeResult */
export type ProviderTestResult = ProviderApiKeySmokeResult;

export async function runProviderKeyTest(
  providerId: string,
  apiKey: string,
): Promise<ProviderApiKeySmokeResult> {
  const provider = resolveProvider(providerId);
  if (!provider) {
    return { ok: false, error: `Unknown provider: ${providerId}` };
  }
  if (provider.id === 'gemini') {
    return smokeTestGeminiApiKey(apiKey);
  }
  if (provider.id === 'openai') {
    return smokeTestOpenAiApiKey(apiKey);
  }
  return {
    ok: false,
    error: `Test not implemented for provider ${provider.id}`,
  };
}
