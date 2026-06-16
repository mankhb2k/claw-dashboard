import { computeSessionUsageDelta } from './session-usage-snapshot';

describe('computeSessionUsageDelta', () => {
  it('returns delta between snapshots', () => {
    expect(
      computeSessionUsageDelta(
        { inputTokens: 100, outputTokens: 20, modelProvider: null, model: null },
        { inputTokens: 150, outputTokens: 35, modelProvider: null, model: null },
      ),
    ).toEqual({ inputTokens: 50, outputTokens: 15 });
  });

  it('falls back to current totals when snapshot regresses', () => {
    expect(
      computeSessionUsageDelta(
        { inputTokens: 200, outputTokens: 40, modelProvider: null, model: null },
        { inputTokens: 50, outputTokens: 10, modelProvider: null, model: null },
      ),
    ).toEqual({ inputTokens: 50, outputTokens: 10 });
  });
});
