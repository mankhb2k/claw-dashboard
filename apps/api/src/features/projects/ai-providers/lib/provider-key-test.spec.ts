jest.mock('../adapters/gemini/gemini-test-key', () => ({
  smokeTestGeminiApiKey: jest
    .fn()
    .mockResolvedValue({ ok: true, model: 'gemini-3.5-flash' }),
}));
jest.mock('../adapters/openai/openai-test-key', () => ({
  smokeTestOpenAiApiKey: jest
    .fn()
    .mockResolvedValue({ ok: true, model: 'gpt-5.4-mini' }),
}));
jest.mock('../adapters/anthropic/anthropic-test-key', () => ({
  smokeTestAnthropicApiKey: jest
    .fn()
    .mockResolvedValue({ ok: true, model: 'claude-haiku-4-5' }),
}));
jest.mock('../adapters/openai-compat/openai-compat-test-key', () => ({
  smokeTestOpenAiCompatApiKey: jest
    .fn()
    .mockResolvedValue({ ok: true, model: 'deepseek-v4-flash' }),
}));

import { runProviderKeyTest } from './provider-key-test';
import { smokeTestAnthropicApiKey } from '../adapters/anthropic/anthropic-test-key';
import { smokeTestGeminiApiKey } from '../adapters/gemini/gemini-test-key';
import { smokeTestOpenAiApiKey } from '../adapters/openai/openai-test-key';
import { smokeTestOpenAiCompatApiKey } from '../adapters/openai-compat/openai-compat-test-key';

describe('runProviderKeyTest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns error for unknown provider', async () => {
    const result = await runProviderKeyTest('unknown', 'key');
    expect(result).toEqual({ ok: false, error: 'Unknown provider: unknown' });
  });

  it('delegates to Gemini adapter', async () => {
    await runProviderKeyTest('gemini', 'g-key');
    expect(smokeTestGeminiApiKey).toHaveBeenCalledWith('g-key');
  });

  it('delegates to OpenAI adapter', async () => {
    await runProviderKeyTest('openai', 'o-key');
    expect(smokeTestOpenAiApiKey).toHaveBeenCalledWith('o-key');
  });

  it('delegates to Anthropic adapter', async () => {
    await runProviderKeyTest('anthropic', 'a-key');
    expect(smokeTestAnthropicApiKey).toHaveBeenCalledWith('a-key');
  });

  it('delegates DeepSeek to OpenAI-compat adapter', async () => {
    await runProviderKeyTest('deepseek', 'd-key');
    expect(smokeTestOpenAiCompatApiKey).toHaveBeenCalledWith({
      apiKey: 'd-key',
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-v4-flash',
    });
  });

  it('delegates Grok (xAI) to OpenAI-compat adapter', async () => {
    await runProviderKeyTest('grok', 'x-key');
    expect(smokeTestOpenAiCompatApiKey).toHaveBeenCalledWith({
      apiKey: 'x-key',
      baseUrl: 'https://api.x.ai/v1',
      model: 'grok-4.3',
    });
  });

  it('delegates Mistral to OpenAI-compat adapter', async () => {
    await runProviderKeyTest('mistral', 'm-key');
    expect(smokeTestOpenAiCompatApiKey).toHaveBeenCalledWith({
      apiKey: 'm-key',
      baseUrl: 'https://api.mistral.ai/v1',
      model: 'mistral-small-latest',
    });
  });
});
