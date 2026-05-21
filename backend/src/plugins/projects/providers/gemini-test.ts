type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
};

export type GeminiTestResult = {
  ok: boolean;
  model?: string;
  message?: string;
  error?: string;
};

/** Smoke test Gemini API key via Generative Language REST API. */
export async function testGeminiApiKey(apiKey: string): Promise<GeminiTestResult> {
  const model = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: 'Reply with exactly: ok' }] }],
    generationConfig: { maxOutputTokens: 64 },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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

  const candidates = parsed.candidates;
  const reply =
    candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim() ?? '';
  if (!reply) {
    return { ok: false, error: 'Empty response from Gemini' };
  }

  return { ok: true, model, message: reply };
}
