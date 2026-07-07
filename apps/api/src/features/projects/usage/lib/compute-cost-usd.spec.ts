import { computeCostUsd } from './compute-cost-usd';

describe('computeCostUsd', () => {
  it('returns 0 when pricing is missing', () => {
    expect(computeCostUsd(1000, 500, null)).toBe('0');
  });

  it('computes blended input/output cost per 1M tokens', () => {
    const cost = computeCostUsd(1_000_000, 500_000, {
      inputPer1MUsd: 2.5,
      outputPer1MUsd: 10,
    });
    expect(cost).toBe('7.5');
  });

  it('returns 0 for zero tokens', () => {
    expect(
      computeCostUsd(0, 0, { inputPer1MUsd: 2.5, outputPer1MUsd: 10 }),
    ).toBe('0');
  });
});
