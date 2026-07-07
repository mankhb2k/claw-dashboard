import { smokeTestAnthropicApiKey } from './anthropic-test-key';

const mockFetch = jest.fn();
global.fetch = mockFetch as typeof fetch;

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response;
}

describe('smokeTestAnthropicApiKey', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns ok with model and reply when Anthropic returns text', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        content: [{ type: 'text', text: 'ok' }],
      }),
    );

    const result = await smokeTestAnthropicApiKey('sk-ant-test');

    expect(result).toEqual({
      ok: true,
      model: 'claude-haiku-4-5',
      message: 'ok',
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/json',
      'x-api-key': 'sk-ant-test',
      'anthropic-version': '2023-06-01',
    });
    const body = JSON.parse(init.body as string) as { model: string };
    expect(body.model).toBe('claude-haiku-4-5');
  });

  it('returns verified when content is empty but HTTP ok', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ content: [] }));

    const result = await smokeTestAnthropicApiKey('key');

    expect(result).toEqual({
      ok: true,
      model: 'claude-haiku-4-5',
      message: 'verified',
    });
  });

  it('returns error with API message on HTTP failure', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ error: { message: 'invalid x-api-key' } }, 401),
    );

    const result = await smokeTestAnthropicApiKey('bad');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('HTTP 401: invalid x-api-key');
  });

  it('returns timeout error when fetch aborts', async () => {
    mockFetch.mockRejectedValue(new Error('The operation was aborted'));

    const result = await smokeTestAnthropicApiKey('key');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Test timeout (15000ms)');
  });
});
