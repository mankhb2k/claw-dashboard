import { resolveProvider } from './provider-registry';
import { smokeTestAnthropicApiKey } from '../adapters/anthropic/anthropic-test-key';
import { smokeTestGeminiApiKey } from '../adapters/gemini/gemini-test-key';
import { smokeTestOpenAiApiKey } from '../adapters/openai/openai-test-key';
import { smokeTestOpenAiCompatApiKey } from '../adapters/openai-compat/openai-compat-test-key';

import type { AnthropicApiKeySmokeResult } from '../adapters/anthropic/anthropic-test-key.types';
import type { GeminiApiKeySmokeResult } from '../adapters/gemini/gemini-test-key.types';
import type { OpenAiApiKeySmokeResult } from '../adapters/openai/openai-test-key.types';

export type ProviderApiKeySmokeResult =
  | AnthropicApiKeySmokeResult
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
  if (provider.id === 'anthropic') {
    return smokeTestAnthropicApiKey(apiKey);
  }
  if (provider.openAiCompatTest) {
    return smokeTestOpenAiCompatApiKey({
      apiKey,
      baseUrl: provider.openAiCompatTest.baseUrl,
      model: provider.openAiCompatTest.model,
    });
  }
  return {
    ok: true,
    message: 'Key saved (connectivity test not implemented for this provider)',
  };
}
