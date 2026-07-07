import type { AnthropicApiKeySmokeResult } from './anthropic-test-key.types';

/** Gọi Anthropic Messages API thật để xác minh API key (không phải Jest). */
const PROVIDER_KEY_TEST_TIMEOUT_MS = 15_000;
const PROVIDER_KEY_TEST_MAX_OUTPUT_TOKENS = 16;
const ANTHROPIC_API_VERSION = '2023-06-01';

type AnthropicMessageResponse = {
  content?: Array<{ type?: string; text?: string }>;
  error?: { type?: string; message?: string };
};

/** Minimal Messages API call to verify Anthropic API key. */
export async function smokeTestAnthropicApiKey(
  apiKey: string,
): Promise<AnthropicApiKeySmokeResult> {
  const model = 'claude-haiku-4-5';
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_API_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: PROVIDER_KEY_TEST_MAX_OUTPUT_TOKENS,
        messages: [{ role: 'user', content: 'Reply with exactly: ok' }],
      }),
      signal: AbortSignal.timeout(PROVIDER_KEY_TEST_TIMEOUT_MS),
    });

    const text = await res.text();
    if (!res.ok) {
      let detail = text.slice(0, 400);
      try {
        const err = JSON.parse(text) as AnthropicMessageResponse;
        detail = err.error?.message ?? detail;
      } catch {
        /* keep */
      }
      return { ok: false, error: `HTTP ${res.status}: ${detail}` };
    }

    const parsed = JSON.parse(text) as AnthropicMessageResponse;
    const reply =
      parsed.content
        ?.filter((block) => block.type === 'text' || block.text != null)
        .map((block) => block.text ?? '')
        .join('')
        .trim() ?? '';
    if (reply || res.ok) {
      return { ok: true, model, message: reply || 'verified' };
    }
    return { ok: false, error: 'Empty response from Anthropic' };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('timeout') || message.includes('aborted')) {
      return {
        ok: false,
        error: `Test timeout (${PROVIDER_KEY_TEST_TIMEOUT_MS}ms)`,
      };
    }
    return { ok: false, error: message };
  }
}

export type { AnthropicApiKeySmokeResult } from './anthropic-test-key.types';
