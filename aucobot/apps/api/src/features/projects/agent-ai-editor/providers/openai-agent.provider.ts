import { toNativeModelId } from '../../skill-ai-editor/providers/model-id.util';
import {
  AGENT_AI_EDITOR_MAX_OUTPUT_TOKENS,
  AGENT_AI_EDITOR_TIMEOUT_MS,
} from '../lib/agent-ai-editor.constants';

import type {
  AgentAiEditorCompleteInput,
  AgentAiEditorProviderAdapter,
  LlmCompleteResult,
} from '../lib/agent-ai-editor.types';

type OpenAiChatResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  error?: { message?: string };
};

export class OpenAiAgentProvider implements AgentAiEditorProviderAdapter {
  readonly id = 'openai';

  async complete(
    input: AgentAiEditorCompleteInput,
  ): Promise<LlmCompleteResult> {
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
        max_tokens: AGENT_AI_EDITOR_MAX_OUTPUT_TOKENS,
        temperature: 0.4,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(AGENT_AI_EDITOR_TIMEOUT_MS),
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

    const parsed = JSON.parse(text) as OpenAiChatResponse;
    const reply = parsed.choices?.[0]?.message?.content?.trim() ?? '';
    if (!reply) throw new Error('Empty response from OpenAI');
    return {
      text: reply,
      inputTokens: parsed.usage?.prompt_tokens ?? 0,
      outputTokens: parsed.usage?.completion_tokens ?? 0,
      latencyMs: Date.now() - startedAt,
    };
  }
}
