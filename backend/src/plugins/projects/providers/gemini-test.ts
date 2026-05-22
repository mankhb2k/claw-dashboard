import {
  PROVIDER_TEST_MAX_OUTPUT_TOKENS,
  PROVIDER_TEST_TIMEOUT_MS,
} from './provider-test.constants';

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
};

export type GeminiTestResult = {
  ok: boolean;
  model?: string;
  message?: string;
  error?: string;
};

/** Smoke test Gemini: minimal generateContent (maxOutputTokens 1–16). */
export async function testGeminiApiKey(apiKey: string): Promise<GeminiTestResult> {
  const model = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: 'ok' }] }],
    generationConfig: { maxOutputTokens: PROVIDER_TEST_MAX_OUTPUT_TOKENS },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(PROVIDER_TEST_TIMEOUT_MS),
    });

    const text = await res.text();
    if (!res.ok) {
      return {
        ok: false,
        error: `HTTP ${res.status}: ${text.slice(0, 400)}`,
      };
    }

    let parsed: GeminiGenerateResponse;
    try {
      parsed = JSON.parse(text) as GeminiGenerateResponse;
    } catch {
      return { ok: false, error: 'Invalid JSON from Gemini API' };
    }

    const blockReason = parsed.promptFeedback?.blockReason;
    if (blockReason) {
      return { ok: false, error: `Gemini blocked: ${blockReason}` };
    }

    const candidate = parsed.candidates?.[0];
    const reply =
      candidate?.content?.parts?.map((p) => p.text ?? '').join('').trim() ?? '';
    if (reply) {
      return { ok: true, model, message: reply };
    }

    // Key hợp lệ nhưng output rỗng (thường gặp khi maxOutputTokens quá nhỏ) — vẫn coi là pass.
    if (candidate && res.ok) {
      return { ok: true, model, message: 'verified' };
    }

    return { ok: false, error: 'Empty response from Gemini' };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('timeout') || message.includes('aborted')) {
      return { ok: false, error: `Test timeout (${PROVIDER_TEST_TIMEOUT_MS}ms)` };
    }
    return { ok: false, error: message };
  }
}
