/** Smoke test: minimal generation (1–16 output tokens). */
export const PROVIDER_TEST_TIMEOUT_MS =
  Number(process.env.PROVIDER_TEST_TIMEOUT_MS ?? 15_000) || 15_000;

const rawMax = Number(process.env.PROVIDER_TEST_MAX_OUTPUT_TOKENS ?? 16) || 16;
export const PROVIDER_TEST_MAX_OUTPUT_TOKENS = Math.min(16, Math.max(1, rawMax));
