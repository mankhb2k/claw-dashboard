import {
  SKILL_AI_EDITOR_MAX_OUTPUT_TOKENS,
  SKILL_AI_EDITOR_TIMEOUT_MS,
} from '../lib/skill-ai-editor.constants';
import type {
  SkillAiEditorCompleteInput,
  SkillAiEditorCompleteResult,
  SkillAiEditorProviderAdapter,
} from '../lib/skill-ai-editor.types';
import { normalizeAssistantMarkdown } from '../lib/skill-ai-editor.prompt';
import { toNativeModelId } from './model-id.util';

type OpenAiChatResponse = {
  choices?: Array<{
    message?: { content?: string | null };
    finish_reason?: string;
  }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  error?: { message?: string };
};

export class OpenAiAssistantProvider implements SkillAiEditorProviderAdapter {
  readonly id = 'openai';

  async complete(input: SkillAiEditorCompleteInput): Promise<SkillAiEditorCompleteResult> {
    const startedAt = Date.now();
    const modelId = toNativeModelId(input.model, 'openai');

    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: input.system },
      ...input.messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages,
        max_tokens: SKILL_AI_EDITOR_MAX_OUTPUT_TOKENS,
        temperature: 0.4,
      }),
      signal: AbortSignal.timeout(SKILL_AI_EDITOR_TIMEOUT_MS),
    });

    const text = await res.text();
    if (!res.ok) {
      let detail = text.slice(0, 500);
      try {
        const err = JSON.parse(text) as OpenAiChatResponse;
        detail = err.error?.message ?? detail;
      } catch {
        /* keep raw */
      }
      throw new Error(`OpenAI API HTTP ${res.status}: ${detail}`);
    }

    let parsed: OpenAiChatResponse;
    try {
      parsed = JSON.parse(text) as OpenAiChatResponse;
    } catch {
      throw new Error('Invalid JSON from OpenAI API');
    }

    const reply = parsed.choices?.[0]?.message?.content?.trim() ?? '';
    if (!reply) {
      throw new Error('Empty response from OpenAI');
    }

    return {
      markdown: normalizeAssistantMarkdown(reply),
      inputTokens: parsed.usage?.prompt_tokens ?? 0,
      outputTokens: parsed.usage?.completion_tokens ?? 0,
      latencyMs: Date.now() - startedAt,
    };
  }
}
