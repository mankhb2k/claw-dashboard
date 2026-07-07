-- Seed model_pricing for overview cost estimates (USD per 1M tokens).
-- Sources: OpenAI / Google Gemini public API pricing (approximate, 2026-06).
-- model_id uses openclawId form (provider/model) or native id for lookup fallback.

INSERT INTO "model_pricing" ("provider_id", "model_id", "input_per_1m_usd", "output_per_1m_usd", "updated_at")
VALUES
  -- OpenAI GPT-5 line (illustrative SaaS catalog)
  ('openai', 'openai/gpt-5.5', 5.000000, 15.000000, CURRENT_TIMESTAMP),
  ('openai', 'gpt-5.5', 5.000000, 15.000000, CURRENT_TIMESTAMP),
  ('openai', 'openai/gpt-5.4', 3.000000, 12.000000, CURRENT_TIMESTAMP),
  ('openai', 'gpt-5.4', 3.000000, 12.000000, CURRENT_TIMESTAMP),
  ('openai', 'openai/gpt-5.4-mini', 0.400000, 1.600000, CURRENT_TIMESTAMP),
  ('openai', 'gpt-5.4-mini', 0.400000, 1.600000, CURRENT_TIMESTAMP),
  ('openai', 'openai/gpt-5.4-nano', 0.100000, 0.400000, CURRENT_TIMESTAMP),
  ('openai', 'gpt-5.4-nano', 0.100000, 0.400000, CURRENT_TIMESTAMP),
  -- Google Gemini
  ('gemini', 'google/gemini-3.5-flash', 0.350000, 1.050000, CURRENT_TIMESTAMP),
  ('gemini', 'gemini-3.5-flash', 0.350000, 1.050000, CURRENT_TIMESTAMP),
  ('gemini', 'google/gemini-3.1-pro-preview', 2.000000, 8.000000, CURRENT_TIMESTAMP),
  ('gemini', 'gemini-3.1-pro-preview', 2.000000, 8.000000, CURRENT_TIMESTAMP),
  ('gemini', 'google/gemini-3-flash-preview', 0.500000, 1.500000, CURRENT_TIMESTAMP),
  ('gemini', 'gemini-3-flash-preview', 0.500000, 1.500000, CURRENT_TIMESTAMP),
  ('gemini', 'google/gemini-2.5-pro', 1.250000, 5.000000, CURRENT_TIMESTAMP),
  ('gemini', 'gemini-2.5-pro', 1.250000, 5.000000, CURRENT_TIMESTAMP),
  ('gemini', 'google/gemini-2.5-flash', 0.300000, 1.200000, CURRENT_TIMESTAMP),
  ('gemini', 'gemini-2.5-flash', 0.300000, 1.200000, CURRENT_TIMESTAMP),
  ('gemini', 'google/gemini-2.5-flash-lite', 0.100000, 0.400000, CURRENT_TIMESTAMP),
  ('gemini', 'gemini-2.5-flash-lite', 0.100000, 0.400000, CURRENT_TIMESTAMP)
ON CONFLICT ("provider_id", "model_id") DO UPDATE SET
  "input_per_1m_usd" = EXCLUDED."input_per_1m_usd",
  "output_per_1m_usd" = EXCLUDED."output_per_1m_usd",
  "updated_at" = CURRENT_TIMESTAMP;
