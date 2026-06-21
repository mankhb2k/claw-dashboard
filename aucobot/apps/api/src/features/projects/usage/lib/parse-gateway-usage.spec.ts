import {
  consumePendingRun,
  mergeSessionEnrichment,
  parseGatewayUsageFrame,
  readUsageNumbers,
} from './parse-gateway-usage';

import type { PendingChatRun } from './usage-record.types';

function pendingMap(
  entries: Array<[string, PendingChatRun]>,
): Map<string, PendingChatRun> {
  return new Map(entries);
}

describe('parseGatewayUsageFrame', () => {
  it('parses chat final with usage + model (OpenClaw SSOT)', () => {
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
          runId: 'run-1',
          sessionKey: 'agent:main:direct',
          idempotencyKey: 'run-1',
          model: 'openai/gpt-5.4-mini',
          usage: { inputTokens: 100, outputTokens: 40 },
        },
      },
      pending,
    );

    expect(parsed).toMatchObject({
      externalId: 'run:run-1',
      source: 'CHAT_UI',
      status: 'SUCCESS',
      modelId: 'openai/gpt-5.4-mini',
      providerId: 'openai',
      inputTokens: 100,
      outputTokens: 40,
      agentSlug: 'main',
      needsSessionEnrichment: false,
    });
    expect(parsed?.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('reads usage/model from nested assistant message', () => {
    const parsed = parseGatewayUsageFrame(
      {
        type: 'event',
        event: 'chat',
        payload: {
          state: 'final',
          runId: 'run-msg',
          sessionKey: 'agent:main:main',
          message: {
            role: 'assistant',
            provider: 'deepseek',
            model: 'deepseek-v4-flash',
            usage: { input: 120, output: 30 },
          },
        },
      },
      pendingMap([]),
    );

    expect(parsed).toMatchObject({
      externalId: 'run:run-msg',
      modelId: 'deepseek/deepseek-v4-flash',
      providerId: 'deepseek',
      inputTokens: 120,
      outputTokens: 30,
      needsSessionEnrichment: false,
    });
  });

  it('flags chat final without usage/model for session enrichment', () => {
    const parsed = parseGatewayUsageFrame(
      {
        type: 'event',
        event: 'chat',
        payload: {
          state: 'final',
          runId: 'run-empty',
          sessionKey: 'agent:main:main',
        },
      },
      pendingMap([]),
    );

    expect(parsed).toMatchObject({
      externalId: 'run:run-empty',
      inputTokens: 0,
      outputTokens: 0,
      modelId: 'unknown',
      needsSessionEnrichment: true,
    });
  });

  it('parses agent lifecycle usage event', () => {
    const parsed = parseGatewayUsageFrame(
      {
        type: 'event',
        event: 'agent',
        payload: {
          runId: 'run-life',
          sessionKey: 'agent:main:main',
          stream: 'lifecycle',
          data: {
            phase: 'usage',
            provider: 'anthropic',
            model: 'claude-sonnet-4-6',
            usage: { input: 50, output: 12, total: 62 },
            durationMs: 1800,
          },
        },
      },
      pendingMap([]),
    );

    expect(parsed).toMatchObject({
      externalId: 'run:run-life',
      source: 'CHAT_UI',
      status: 'SUCCESS',
      modelId: 'anthropic/claude-sonnet-4-6',
      providerId: 'anthropic',
      inputTokens: 50,
      outputTokens: 12,
      latencyMs: 1800,
    });
  });

  it('maps chat error to FAILED', () => {
    const parsed = parseGatewayUsageFrame(
      {
        type: 'event',
        event: 'chat',
        payload: {
          state: 'error',
          runId: 'run-err',
          sessionKey: 'agent:main:direct',
          idempotencyKey: 'run-err',
        },
      },
      pendingMap([]),
    );

    expect(parsed?.status).toBe('FAILED');
    expect(parsed?.externalId).toBe('run:run-err');
  });

  it('infers CRON source from cron session key', () => {
    const parsed = parseGatewayUsageFrame(
      {
        type: 'event',
        event: 'chat',
        payload: {
          state: 'final',
          runId: 'run-cron',
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
      externalId: 'run:run-9',
      source: 'CRON',
      status: 'SUCCESS',
      inputTokens: 20,
      outputTokens: 8,
    });
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
      externalId: 'run:u-1',
      source: 'CHANNEL',
      inputTokens: 3,
      outputTokens: 2,
    });
  });

  it('consumePendingRun removes chat pending entry by run id', () => {
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
        payload: { state: 'final', runId: 'run-1', idempotencyKey: 'run-1' },
      },
      pending,
    );
    expect(parsed).not.toBeNull();
    consumePendingRun(parsed!, pending);
    expect(pending.has('run-1')).toBe(false);
  });
});

describe('readUsageNumbers', () => {
  it('supports OpenClaw input/output aliases', () => {
    expect(readUsageNumbers({ input: 10, output: 4 })).toEqual({
      inputTokens: 10,
      outputTokens: 4,
    });
  });
});

describe('mergeSessionEnrichment', () => {
  it('fills tokens and model from session store delta', () => {
    const base = parseGatewayUsageFrame(
      {
        type: 'event',
        event: 'chat',
        payload: {
          state: 'final',
          runId: 'run-enrich',
          sessionKey: 'agent:main:main',
        },
      },
      pendingMap([]),
    );
    expect(base).not.toBeNull();

    const enriched = mergeSessionEnrichment(
      base!,
      {
        inputTokens: 200,
        outputTokens: 40,
        modelProvider: 'deepseek',
        model: 'deepseek-v4-flash',
      },
      { inputTokens: 50, outputTokens: 10 },
    );

    expect(enriched).toMatchObject({
      inputTokens: 50,
      outputTokens: 10,
      modelId: 'deepseek/deepseek-v4-flash',
      providerId: 'deepseek',
      needsSessionEnrichment: false,
    });
  });
});
