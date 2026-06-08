import {
  SKILL_AI_EDITOR_MAX_OUTPUT_TOKENS,
  SKILL_AI_EDITOR_TIMEOUT_MS,
} from '../skill-ai-editor/skill-ai-editor.constants';

export const AGENT_AI_EDITOR_MAX_MESSAGES = 20;
export const AGENT_AI_EDITOR_MAX_MARKDOWN_CHARS = 12_000;
export const AGENT_AI_EDITOR_SUPPORTED_PROVIDERS = ['gemini', 'openai'] as const;

export type AgentAiEditorProviderId =
  (typeof AGENT_AI_EDITOR_SUPPORTED_PROVIDERS)[number];

export {
  SKILL_AI_EDITOR_MAX_OUTPUT_TOKENS as AGENT_AI_EDITOR_MAX_OUTPUT_TOKENS,
  SKILL_AI_EDITOR_TIMEOUT_MS as AGENT_AI_EDITOR_TIMEOUT_MS,
};
