/** Env keys managed by provider-key sync into openclaw.json `env`. */
export const PROVIDER_ENV_KEYS = new Set([
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GEMINI_API_KEY',
  'DEEPSEEK_API_KEY',
  'GROQ_API_KEY',
  'MISTRAL_API_KEY',
  'OPENROUTER_API_KEY',
  'TOGETHER_API_KEY',
  'AI_GATEWAY_API_KEY',
  'KILOCODE_API_KEY',
]);

const ENV_KEY_TO_PROVIDER_ID: Record<string, string> = {
  OPENAI_API_KEY: 'openai',
  ANTHROPIC_API_KEY: 'anthropic',
  GEMINI_API_KEY: 'gemini',
  DEEPSEEK_API_KEY: 'deepseek',
  GROQ_API_KEY: 'groq',
  MISTRAL_API_KEY: 'mistral',
  OPENROUTER_API_KEY: 'openrouter',
  TOGETHER_API_KEY: 'together',
  AI_GATEWAY_API_KEY: 'vercel-ai-gateway',
  KILOCODE_API_KEY: 'kilocode',
};

export function providerIdForEnvKey(envKey: string): string {
  return ENV_KEY_TO_PROVIDER_ID[envKey] ?? envKey;
}
