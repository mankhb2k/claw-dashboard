import { parseCronRunRpcUsage } from './parse-rpc-usage';

describe('parseCronRunRpcUsage', () => {
  it('returns null when runId is missing', () => {
    expect(parseCronRunRpcUsage('job-1', { ok: true })).toBeNull();
  });

  it('parses cron.run response with usage block', () => {
    const parsed = parseCronRunRpcUsage('job-1', {
      runId: 'run-9',
      agentId: 'main',
      model: 'openai/gpt-5.4-mini',
      usage: { inputTokens: 20, outputTokens: 8 },
      latencyMs: 900,
    });

    expect(parsed).toMatchObject({
      externalId: 'cron:job-1:run-9',
      source: 'CRON',
      status: 'SUCCESS',
      inputTokens: 20,
      outputTokens: 8,
      agentSlug: 'main',
    });
  });
});
