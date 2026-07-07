import { smokeTestGeminiApiKey } from './gemini-test-key';

const mockFetch = jest.fn();
global.fetch = mockFetch as typeof fetch;

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response;
}

describe('smokeTestGeminiApiKey', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns ok with model and reply when Gemini returns text', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        candidates: [{ content: { parts: [{ text: 'ok' }] } }],
      }),
    );

    const result = await smokeTestGeminiApiKey('test-gemini-key');

    expect(result).toEqual({
      ok: true,
      model: 'gemini-3.5-flash',
      message: 'ok',
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('generativelanguage.googleapis.com');
    expect(url).toContain('gemini-3.5-flash');
    expect(url).toContain(encodeURIComponent('test-gemini-key'));
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });
  });

  it('returns verified when candidate exists but reply is empty', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        candidates: [{ content: { parts: [{ text: '' }] } }],
      }),
    );

    const result = await smokeTestGeminiApiKey('key');

    expect(result).toEqual({
      ok: true,
      model: 'gemini-3.5-flash',
      message: 'verified',
    });
  });

  it('returns error on HTTP failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      text: () => Promise.resolve('API key invalid'),
    });

    const result = await smokeTestGeminiApiKey('bad-key');

    expect(result.ok).toBe(false);
    expect(result.error).toContain('HTTP 403');
    expect(result.error).toContain('API key invalid');
  });

  it('returns error when response is not valid JSON', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('not-json'),
    });

    const result = await smokeTestGeminiApiKey('key');

    expect(result).toEqual({
      ok: false,
      error: 'Invalid JSON from Gemini API',
    });
  });

  it('returns error when prompt is blocked', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        promptFeedback: { blockReason: 'SAFETY' },
      }),
    );

    const result = await smokeTestGeminiApiKey('key');

    expect(result).toEqual({ ok: false, error: 'Gemini blocked: SAFETY' });
  });

  it('returns error when response has no candidates', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ candidates: [] }));

    const result = await smokeTestGeminiApiKey('key');

    expect(result).toEqual({ ok: false, error: 'Empty response from Gemini' });
  });

  it('returns timeout error when fetch aborts', async () => {
    mockFetch.mockRejectedValue(new Error('The operation was aborted'));

    const result = await smokeTestGeminiApiKey('key');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Test timeout (15000ms)');
  });
});
