import type { OpenAiApiKeySmokeResult } from './openai-test-key.types';

/** Gọi OpenAI API thật để xác minh API key (không phải Jest). */
const PROVIDER_KEY_TEST_TIMEOUT_MS = 15_000;
const PROVIDER_KEY_TEST_MAX_OUTPUT_TOKENS = 16;

type OpenAiChatResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
};

/** Call OpenAI chat completion minimally to verify API key. */
export async function smokeTestOpenAiApiKey(
  apiKey: string,
): Promise<OpenAiApiKeySmokeResult> {
  const model = 'gpt-5.4-mini';
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Reply with exactly: ok' }],
        max_tokens: PROVIDER_KEY_TEST_MAX_OUTPUT_TOKENS,
      }),
      signal: AbortSignal.timeout(PROVIDER_KEY_TEST_TIMEOUT_MS),
    });

    const text = await res.text();
    if (!res.ok) {
      let detail = text.slice(0, 400);
      try {
        const err = JSON.parse(text) as OpenAiChatResponse;
        detail = err.error?.message ?? detail;
      } catch {
        /* keep */
      }
      return { ok: false, error: `HTTP ${res.status}: ${detail}` };
    }

    const parsed = JSON.parse(text) as OpenAiChatResponse;
    const reply = parsed.choices?.[0]?.message?.content?.trim() ?? '';
    if (reply || res.ok) {
      return { ok: true, model, message: reply || 'verified' };
    }
    return { ok: false, error: 'Empty response from OpenAI' };
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

export type { OpenAiApiKeySmokeResult } from './openai-test-key.types';
