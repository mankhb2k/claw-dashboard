export const ALLOWED_PROJECT_ENV_KEYS = new Set<string>([
  // Model providers
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GEMINI_API_KEY',
  'OPENROUTER_API_KEY',
  'GOOGLE_API_KEY',
  'OPENAI_API_KEYS',
  'ANTHROPIC_API_KEYS',
  'GEMINI_API_KEYS',
  // Optional providers
  'ZAI_API_KEY',
  'AI_GATEWAY_API_KEY',
  'TOKENHUB_API_KEY',
  'LKEAP_API_KEY',
  'MINIMAX_API_KEY',
  'SYNTHETIC_API_KEY',
  // Channels
  'TELEGRAM_BOT_TOKEN',
  'DISCORD_BOT_TOKEN',
  'SLACK_BOT_TOKEN',
  'SLACK_APP_TOKEN',
  'MATTERMOST_BOT_TOKEN',
  'ZALO_BOT_TOKEN',
  'OPENCLAW_TWITCH_ACCESS_TOKEN',
  // Tools + media
  'BRAVE_API_KEY',
  'PERPLEXITY_API_KEY',
  'FIRECRAWL_API_KEY',
  'ELEVENLABS_API_KEY',
  'XI_API_KEY',
  'INWORLD_API_KEY',
  'DEEPGRAM_API_KEY',
]);

export function providerToEnvKey(provider: 'chatgpt' | 'gemini' | 'claude'): string {
  if (provider === 'chatgpt') return 'OPENAI_API_KEY';
  if (provider === 'gemini') return 'GEMINI_API_KEY';
  return 'ANTHROPIC_API_KEY';
}
