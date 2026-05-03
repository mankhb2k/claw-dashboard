/** Env name stored in project_secrets and injected into the OpenClaw container. */
export const OPENCLAW_GATEWAY_TOKEN_KEY = 'OPENCLAW_GATEWAY_TOKEN' as const;

/** Model / provider keys users may set via PUT /api/projects/:id/env (aligned with frontend). */
export const PROJECT_MODEL_ENV_KEYS = [
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GEMINI_API_KEY',
  'OPENROUTER_API_KEY',
  'GOOGLE_API_KEY',
] as const;

export type ProjectModelEnvKey = (typeof PROJECT_MODEL_ENV_KEYS)[number];

const MODEL_KEY_SET = new Set<string>(PROJECT_MODEL_ENV_KEYS);

export function isProjectModelEnvKey(key: string): key is ProjectModelEnvKey {
  return MODEL_KEY_SET.has(key);
}
