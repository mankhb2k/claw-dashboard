import { testGeminiApiKey, type GeminiTestResult } from './gemini-test';
import { testOpenAiApiKey, type OpenAiTestResult } from './openai-test';
import { resolveProvider } from './provider-registry';

export type ProviderTestResult = GeminiTestResult | OpenAiTestResult;

export async function runProviderKeyTest(
  providerId: string,
  apiKey: string,
): Promise<ProviderTestResult> {
  const provider = resolveProvider(providerId);
  if (!provider) {
    return { ok: false, error: `Unknown provider: ${providerId}` };
  }
  if (provider.id === 'gemini') {
    return testGeminiApiKey(apiKey);
  }
  if (provider.id === 'openai') {
    return testOpenAiApiKey(apiKey);
  }
  return { ok: false, error: `Test not implemented for provider ${provider.id}` };
}
