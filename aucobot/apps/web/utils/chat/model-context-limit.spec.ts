import {
  DEFAULT_MODEL_CONTEXT_TOKENS,
  GEMINI_CONTEXT_TOKENS,
  resolveModelContextTokens,
} from './model-context-limit'

describe('resolveModelContextTokens', () => {
  it('uses 1M for google/gemini models', () => {
    expect(resolveModelContextTokens('google/gemini-2.5-flash')).toBe(
      GEMINI_CONTEXT_TOKENS,
    )
    expect(resolveModelContextTokens('gemini/gemini-3-flash')).toBe(
      GEMINI_CONTEXT_TOKENS,
    )
  })

  it('uses 200k for non-gemini models', () => {
    expect(resolveModelContextTokens('deepseek/deepseek-v4-flash')).toBe(
      DEFAULT_MODEL_CONTEXT_TOKENS,
    )
    expect(resolveModelContextTokens('openai/gpt-5.4-mini')).toBe(
      DEFAULT_MODEL_CONTEXT_TOKENS,
    )
    expect(resolveModelContextTokens('anthropic/claude-sonnet-4-6')).toBe(
      DEFAULT_MODEL_CONTEXT_TOKENS,
    )
  })
})
