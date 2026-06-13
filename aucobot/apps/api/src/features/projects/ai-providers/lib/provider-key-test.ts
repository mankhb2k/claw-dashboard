import type { GeminiApiKeySmokeResult } from '../adapters/gemini/gemini-test-key.types';
import { smokeTestGeminiApiKey } from '../adapters/gemini/gemini-test-key';
import type { OpenAiApiKeySmokeResult } from '../adapters/openai/openai-test-key.types';
import { smokeTestOpenAiApiKey } from '../adapters/openai/openai-test-key';
import { smokeTestOpenAiCompatApiKey } from '../adapters/openai-compat/openai-compat-test-key';
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
