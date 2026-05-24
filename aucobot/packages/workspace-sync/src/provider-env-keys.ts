/** Env keys managed by provider-key sync into openclaw.json `env`. */
export const PROVIDER_ENV_KEYS = new Set([
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GEMINI_API_KEY',
  'OPENROUTER_API_KEY',
  'GOOGLE_API_KEY',
  'DEEPSEEK_API_KEY',
  'GROQ_API_KEY',
]);

const ENV_KEY_TO_PROVIDER_ID: Record<string, string> = {
  OPENAI_API_KEY: 'openai',
  ANTHROPIC_API_KEY: 'anthropic',
  GEMINI_API_KEY: 'gemini',
  OPENROUTER_API_KEY: 'openrouter',
  GOOGLE_API_KEY: 'google',
  DEEPSEEK_API_KEY: 'deepseek',
  GROQ_API_KEY: 'groq',
};

export function providerIdForEnvKey(envKey: string): string {
  return ENV_KEY_TO_PROVIDER_ID[envKey] ?? envKey;
}
