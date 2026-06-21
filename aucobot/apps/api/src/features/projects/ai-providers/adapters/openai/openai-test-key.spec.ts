import { smokeTestOpenAiApiKey } from './openai-test-key';

const mockFetch = jest.fn();
global.fetch = mockFetch as typeof fetch;

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response;
}

describe('smokeTestOpenAiApiKey', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns ok with model and reply when OpenAI returns content', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        choices: [{ message: { content: 'ok' } }],
      }),
    );

    const result = await smokeTestOpenAiApiKey('sk-test');

    expect(result).toEqual({ ok: true, model: 'gpt-5.4-mini', message: 'ok' });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/json',
      Authorization: 'Bearer sk-test',
    });
    const body = JSON.parse(init.body as string) as {
      model: string;
      messages: unknown[];
      max_completion_tokens: number;
    };
    expect(body.model).toBe('gpt-5.4-mini');
    expect(body.max_completion_tokens).toBe(16);
    expect(body.messages).toHaveLength(1);
  });

  it('returns verified when choices content is empty but HTTP ok', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        choices: [{ message: { content: '' } }],
      }),
    );

    const result = await smokeTestOpenAiApiKey('sk-test');

    expect(result).toEqual({
      ok: true,
      model: 'gpt-5.4-mini',
      message: 'verified',
    });
  });

  it('returns error with API message on HTTP failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      text: () =>
        Promise.resolve(
          JSON.stringify({ error: { message: 'Incorrect API key provided' } }),
        ),
    });

    const result = await smokeTestOpenAiApiKey('bad');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('HTTP 401: Incorrect API key provided');
  });

  it('returns raw body snippet when error JSON is invalid', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('upstream error'),
    });

    const result = await smokeTestOpenAiApiKey('key');

    expect(result.error).toBe('HTTP 500: upstream error');
  });

  it('returns verified when choices array is empty but HTTP ok', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ choices: [] }));

    const result = await smokeTestOpenAiApiKey('key');

    expect(result).toEqual({
      ok: true,
      model: 'gpt-5.4-mini',
      message: 'verified',
    });
  });

  it('returns timeout error when fetch times out', async () => {
    mockFetch.mockRejectedValue(new Error('fetch failed: timeout'));

    const result = await smokeTestOpenAiApiKey('key');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Test timeout (15000ms)');
  });

  it('returns generic error for other network failures', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await smokeTestOpenAiApiKey('key');

    expect(result).toEqual({ ok: false, error: 'ECONNREFUSED' });
  });
});
