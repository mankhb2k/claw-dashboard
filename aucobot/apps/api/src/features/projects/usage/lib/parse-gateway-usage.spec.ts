import type { PendingChatRun } from './usage-record.types';
import {
  consumePendingRun,
  parseGatewayUsageFrame,
} from './parse-gateway-usage';

function pendingMap(
  entries: Array<[string, PendingChatRun]>,
): Map<string, PendingChatRun> {
  return new Map(entries);
}

describe('parseGatewayUsageFrame', () => {
  it('parses chat final with idempotency key and usage', () => {
    const pending = pendingMap([
      [
        'run-1',
        {
          idempotencyKey: 'run-1',
          sessionKey: 'agent:main:direct',
          agentSlug: 'main',
          startedAt: Date.now() - 1200,
        },
      ],
    ]);

    const parsed = parseGatewayUsageFrame(
      {
        type: 'event',
        event: 'chat',
        payload: {
          state: 'final',
          sessionKey: 'agent:main:direct',
          idempotencyKey: 'run-1',
          model: 'openai/gpt-5.4-mini',
          usage: { inputTokens: 100, outputTokens: 40 },
        },
      },
      pending,
    );

    expect(parsed).toMatchObject({
      externalId: 'chat:run-1',
      source: 'CHAT_UI',
      status: 'SUCCESS',
      modelId: 'openai/gpt-5.4-mini',
      providerId: 'openai',
      inputTokens: 100,
      outputTokens: 40,
      agentSlug: 'main',
    });
    expect(parsed?.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('maps chat error to FAILED', () => {
    const parsed = parseGatewayUsageFrame(
      {
        type: 'event',
        event: 'chat',
        payload: {
          state: 'error',
          sessionKey: 'agent:main:direct',
          idempotencyKey: 'run-err',
        },
      },
      pendingMap([]),
    );

    expect(parsed?.status).toBe('FAILED');
    expect(parsed?.externalId).toBe('chat:run-err');
  });

  it('infers CRON source from cron session key', () => {
    const parsed = parseGatewayUsageFrame(
      {
        type: 'event',
        event: 'chat',
        payload: {
          state: 'final',
          sessionKey: 'cron:job-1:run-abc',
          model: 'google/gemini-2.5-flash',
          usage: { prompt_tokens: 10, completion_tokens: 5 },
        },
      },
      pendingMap([]),
    );

    expect(parsed?.source).toBe('CRON');
  });

  it('parses agent completion for cron job', () => {
    const parsed = parseGatewayUsageFrame(
      {
        type: 'event',
        event: 'agent',
        payload: {
          phase: 'final',
          jobId: 'job-1',
          runId: 'run-9',
          model: 'openai/gpt-5.4-mini',
          usage: { input: 20, output: 8 },
        },
      },
      pendingMap([]),
    );

    expect(parsed).toMatchObject({
      externalId: 'cron:job-1:run-9',
      source: 'CRON',
      status: 'SUCCESS',
      inputTokens: 20,
      outputTokens: 8,
    });
  });

  it('parses heartbeat agent event with minute bucket external id', () => {
    const parsed = parseGatewayUsageFrame(
      {
        type: 'event',
        event: 'agent',
        payload: {
          phase: 'done',
          sessionKey: 'heartbeat:main:tick',
          model: 'google/gemini-2.5-flash',
          usage: { inputTokens: 1, outputTokens: 1 },
        },
      },
      pendingMap([]),
    );

    expect(parsed?.source).toBe('HEARTBEAT');
    expect(parsed?.externalId).toMatch(/^heartbeat:main:/);
  });

  it('parses explicit model.usage event', () => {
    const parsed = parseGatewayUsageFrame(
      {
        type: 'event',
        event: 'model.usage',
        payload: {
          runId: 'u-1',
          source: 'CHANNEL',
          model: 'openai/gpt-5.4-mini',
          usage: { inputTokens: 3, outputTokens: 2 },
        },
      },
      pendingMap([]),
    );

    expect(parsed).toMatchObject({
      externalId: 'usage:u-1',
      source: 'CHANNEL',
      inputTokens: 3,
      outputTokens: 2,
    });
  });

  it('consumePendingRun removes chat pending entry', () => {
    const pending = pendingMap([
      [
        'run-1',
        {
          idempotencyKey: 'run-1',
          sessionKey: 'agent:main:direct',
          startedAt: Date.now(),
        },
      ],
    ]);
    const parsed = parseGatewayUsageFrame(
      {
        type: 'event',
        event: 'chat',
        payload: { state: 'final', idempotencyKey: 'run-1' },
      },
      pending,
    );
    expect(parsed).not.toBeNull();
    consumePendingRun(parsed!, pending);
    expect(pending.has('run-1')).toBe(false);
  });
});
