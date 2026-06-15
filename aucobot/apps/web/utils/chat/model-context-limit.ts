/** UI context ring max tokens — gateway session.contextTokens can be wrong per provider. */
export const GEMINI_CONTEXT_TOKENS = 1_000_000
export const DEFAULT_MODEL_CONTEXT_TOKENS = 200_000

/** Gemini / Google models use 1M; all other providers default to 200k in the UI. */
export function resolveModelContextTokens(modelOpenclawId?: string | null): number {
  const id = modelOpenclawId?.trim().toLowerCase() ?? ''
  if (id.startsWith('google/') || id.startsWith('gemini/')) {
    return GEMINI_CONTEXT_TOKENS
  }
  return DEFAULT_MODEL_CONTEXT_TOKENS
}
