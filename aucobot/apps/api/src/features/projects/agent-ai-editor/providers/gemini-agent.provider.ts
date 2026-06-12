import {
  AGENT_AI_EDITOR_MAX_OUTPUT_TOKENS,
  AGENT_AI_EDITOR_TIMEOUT_MS,
} from '../lib/agent-ai-editor.constants';
import type {
  AgentAiEditorCompleteInput,
  AgentAiEditorProviderAdapter,
  LlmCompleteResult,
} from '../lib/agent-ai-editor.types';
import { toNativeModelId } from '../../skill-ai-editor/providers/model-id.util';

type GeminiGenerateResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
  promptFeedback?: { blockReason?: string };
};

export class GeminiAgentProvider implements AgentAiEditorProviderAdapter {
  readonly id = 'gemini';

  async complete(input: AgentAiEditorCompleteInput): Promise<LlmCompleteResult> {
    const startedAt = Date.now();
    const modelId = toNativeModelId(input.model, 'google');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(input.apiKey)}`;

    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    for (const msg of input.messages) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }

    const body = {
      systemInstruction: { parts: [{ text: input.system }] },
      contents,
      generationConfig: {
        maxOutputTokens: AGENT_AI_EDITOR_MAX_OUTPUT_TOKENS,
        temperature: 0.4,
        responseMimeType: 'application/json',
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(AGENT_AI_EDITOR_TIMEOUT_MS),
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Gemini API HTTP ${res.status}: ${text.slice(0, 500)}`);
    }

    const parsed = JSON.parse(text) as GeminiGenerateResponse;
    const blockReason = parsed.promptFeedback?.blockReason;
    if (blockReason) throw new Error(`Gemini blocked: ${blockReason}`);

    const reply =
      parsed.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim() ??
      '';
    if (!reply) throw new Error('Empty response from Gemini');
    return {
      text: reply,
      inputTokens: parsed.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: parsed.usageMetadata?.candidatesTokenCount ?? 0,
      latencyMs: Date.now() - startedAt,
    };
  }
}
