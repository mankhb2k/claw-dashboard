/**
 * Model pricing — static catalog bundled in the repo (USD per 1M tokens).
 *
 * Cost is snapshotted onto `model_usage_events.cost_usd` at record time, so the
 * overview never needs to join pricing.
 *
 * `modelId` is stored in both `provider/model` and native `model` forms so lookups
 * work regardless of which id form the gateway reports.
 * Sources: OpenAI / Google Gemini public API pricing (approximate, 2026-06).
 */
export type ModelPricingEntry = {
  providerId: string;
  modelId: string;
  inputPer1MUsd: number;
  outputPer1MUsd: number;
};

export const MODEL_PRICING_CATALOG: readonly ModelPricingEntry[] = [
  // OpenAI GPT-5 line (illustrative SaaS catalog)
  {
    providerId: 'openai',
    modelId: 'openai/gpt-5.5',
    inputPer1MUsd: 5,
    outputPer1MUsd: 15,
  },
  {
    providerId: 'openai',
    modelId: 'gpt-5.5',
    inputPer1MUsd: 5,
    outputPer1MUsd: 15,
  },
  {
    providerId: 'openai',
    modelId: 'openai/gpt-5.4',
    inputPer1MUsd: 3,
    outputPer1MUsd: 12,
  },
  {
    providerId: 'openai',
    modelId: 'gpt-5.4',
    inputPer1MUsd: 3,
    outputPer1MUsd: 12,
  },
  {
    providerId: 'openai',
    modelId: 'openai/gpt-5.4-mini',
    inputPer1MUsd: 0.4,
    outputPer1MUsd: 1.6,
  },
  {
    providerId: 'openai',
    modelId: 'gpt-5.4-mini',
    inputPer1MUsd: 0.4,
    outputPer1MUsd: 1.6,
  },
  {
    providerId: 'openai',
    modelId: 'openai/gpt-5.4-nano',
    inputPer1MUsd: 0.1,
    outputPer1MUsd: 0.4,
  },
  {
    providerId: 'openai',
    modelId: 'gpt-5.4-nano',
    inputPer1MUsd: 0.1,
    outputPer1MUsd: 0.4,
  },
  // Google Gemini
  {
    providerId: 'gemini',
    modelId: 'google/gemini-3.5-flash',
    inputPer1MUsd: 0.35,
    outputPer1MUsd: 1.05,
  },
  {
    providerId: 'gemini',
    modelId: 'gemini-3.5-flash',
    inputPer1MUsd: 0.35,
    outputPer1MUsd: 1.05,
  },
  {
    providerId: 'gemini',
    modelId: 'google/gemini-3.1-pro-preview',
    inputPer1MUsd: 2,
    outputPer1MUsd: 8,
  },
  {
    providerId: 'gemini',
    modelId: 'gemini-3.1-pro-preview',
    inputPer1MUsd: 2,
    outputPer1MUsd: 8,
  },
  {
    providerId: 'gemini',
    modelId: 'google/gemini-3-flash-preview',
    inputPer1MUsd: 0.5,
    outputPer1MUsd: 1.5,
  },
  {
    providerId: 'gemini',
    modelId: 'gemini-3-flash-preview',
    inputPer1MUsd: 0.5,
    outputPer1MUsd: 1.5,
  },
  {
    providerId: 'gemini',
    modelId: 'google/gemini-2.5-pro',
    inputPer1MUsd: 1.25,
    outputPer1MUsd: 5,
  },
  {
    providerId: 'gemini',
    modelId: 'gemini-2.5-pro',
    inputPer1MUsd: 1.25,
    outputPer1MUsd: 5,
  },
  {
    providerId: 'gemini',
    modelId: 'google/gemini-2.5-flash',
    inputPer1MUsd: 0.3,
    outputPer1MUsd: 1.2,
  },
  {
    providerId: 'gemini',
    modelId: 'gemini-2.5-flash',
    inputPer1MUsd: 0.3,
    outputPer1MUsd: 1.2,
  },
  {
    providerId: 'gemini',
    modelId: 'google/gemini-2.5-flash-lite',
    inputPer1MUsd: 0.1,
    outputPer1MUsd: 0.4,
  },
  {
    providerId: 'gemini',
    modelId: 'gemini-2.5-flash-lite',
    inputPer1MUsd: 0.1,
    outputPer1MUsd: 0.4,
  },
];

const PRICING_INDEX = new Map<string, ModelPricingEntry>(
  MODEL_PRICING_CATALOG.map((entry) => [
    `${entry.providerId}\u0000${entry.modelId}`,
    entry,
  ]),
);

export function findModelPricing(
  providerId: string,
  modelId: string,
): ModelPricingEntry | null {
  return PRICING_INDEX.get(`${providerId}\u0000${modelId}`) ?? null;
}
