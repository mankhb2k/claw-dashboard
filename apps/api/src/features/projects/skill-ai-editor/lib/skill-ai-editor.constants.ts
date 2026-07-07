function envMs(
  current: string | undefined,
  legacy: string | undefined,
  fallback: number,
): number {
  const raw = current ?? legacy;
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** @deprecated Use SKILL_AI_EDITOR_TIMEOUT_MS (SKILL_ASSISTANT_TIMEOUT_MS still read as fallback). */
export const SKILL_AI_EDITOR_TIMEOUT_MS = envMs(
  process.env.SKILL_AI_EDITOR_TIMEOUT_MS,
  process.env.SKILL_ASSISTANT_TIMEOUT_MS,
  120_000,
);

/** @deprecated Use SKILL_AI_EDITOR_MAX_OUTPUT_TOKENS (SKILL_ASSISTANT_MAX_OUTPUT_TOKENS still read as fallback). */
export const SKILL_AI_EDITOR_MAX_OUTPUT_TOKENS = envMs(
  process.env.SKILL_AI_EDITOR_MAX_OUTPUT_TOKENS,
  process.env.SKILL_ASSISTANT_MAX_OUTPUT_TOKENS,
  8192,
);

/** Max markdown body returned to client (chars). */
export const SKILL_AI_EDITOR_MAX_MARKDOWN_CHARS = 64_000;

export const SKILL_AI_EDITOR_MAX_MESSAGES = 20;

export const SKILL_AI_EDITOR_SUPPORTED_PROVIDERS = [
  'gemini',
  'openai',
] as const;

export type SkillAiEditorProviderId =
  (typeof SKILL_AI_EDITOR_SUPPORTED_PROVIDERS)[number];
