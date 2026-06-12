import type { ModelPricingRow } from './usage-record.types';

export function computeCostUsd(
  inputTokens: number,
  outputTokens: number,
  pricing: ModelPricingRow | null | undefined,
): string {
  if (!pricing) {
    return '0';
  }

  const inputRate = Number(pricing.inputPer1MUsd);
  const outputRate = Number(pricing.outputPer1MUsd);
  if (!Number.isFinite(inputRate) || !Number.isFinite(outputRate)) {
    return '0';
  }

  const cost = (inputTokens / 1_000_000) * inputRate + (outputTokens / 1_000_000) * outputRate;
  if (!Number.isFinite(cost) || cost <= 0) {
    return '0';
  }

  return cost.toFixed(6).replace(/\.?0+$/, '') || '0';
}
