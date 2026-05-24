import {
  SKILL_ASSISTANT_MAX_OUTPUT_TOKENS,
  SKILL_ASSISTANT_TIMEOUT_MS,
} from '../skill-assistant.constants';
import type {
  SkillAssistantCompleteInput,
  SkillAssistantCompleteResult,
  SkillAssistantProviderAdapter,
} from '../skill-assistant.types';
import { normalizeAssistantMarkdown } from '../skill-assistant.prompt';
import { toNativeModelId } from './model-id.util';

type OpenAiChatResponse = {
  choices?: Array<{
    message?: { content?: string | null };
    finish_reason?: string;
  }>;
  error?: { message?: string };
};

export class OpenAiAssistantProvider implements SkillAssistantProviderAdapter {
  readonly id = 'openai';

  async complete(input: SkillAssistantCompleteInput): Promise<SkillAssistantCompleteResult> {
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
        max_tokens: SKILL_ASSISTANT_MAX_OUTPUT_TOKENS,
        temperature: 0.4,
      }),
      signal: AbortSignal.timeout(SKILL_ASSISTANT_TIMEOUT_MS),
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

    return { markdown: normalizeAssistantMarkdown(reply) };
  }
}
