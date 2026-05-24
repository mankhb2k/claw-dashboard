export const SKILL_ASSISTANT_TIMEOUT_MS =
  Number(process.env.SKILL_ASSISTANT_TIMEOUT_MS ?? 120_000) || 120_000;

export const SKILL_ASSISTANT_MAX_OUTPUT_TOKENS =
  Number(process.env.SKILL_ASSISTANT_MAX_OUTPUT_TOKENS ?? 8192) || 8192;

/** Max markdown body returned to client (chars). */
export const SKILL_ASSISTANT_MAX_MARKDOWN_CHARS = 64_000;

export const SKILL_ASSISTANT_MAX_MESSAGES = 20;

export const SKILL_ASSISTANT_SUPPORTED_PROVIDERS = ['gemini', 'openai'] as const;

export type SkillAssistantProviderId =
  (typeof SKILL_ASSISTANT_SUPPORTED_PROVIDERS)[number];
