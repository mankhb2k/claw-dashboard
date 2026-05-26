import {
  SKILL_AI_EDITOR_MAX_OUTPUT_TOKENS,
  SKILL_AI_EDITOR_TIMEOUT_MS,
} from '../skill-ai-editor.constants';
import type {
  SkillAiEditorCompleteInput,
  SkillAiEditorCompleteResult,
  SkillAiEditorProviderAdapter,
} from '../skill-ai-editor.types';
import { normalizeAssistantMarkdown } from '../skill-ai-editor.prompt';
import { toNativeModelId } from './model-id.util';

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  promptFeedback?: { blockReason?: string };
};

export class GeminiAssistantProvider implements SkillAiEditorProviderAdapter {
  readonly id = 'gemini';

  async complete(input: SkillAiEditorCompleteInput): Promise<SkillAiEditorCompleteResult> {
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
        maxOutputTokens: SKILL_AI_EDITOR_MAX_OUTPUT_TOKENS,
        temperature: 0.4,
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(SKILL_AI_EDITOR_TIMEOUT_MS),
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Gemini API HTTP ${res.status}: ${text.slice(0, 500)}`);
    }

    let parsed: GeminiGenerateResponse;
    try {
      parsed = JSON.parse(text) as GeminiGenerateResponse;
    } catch {
      throw new Error('Invalid JSON from Gemini API');
    }

    const blockReason = parsed.promptFeedback?.blockReason;
    if (blockReason) {
      throw new Error(`Gemini blocked: ${blockReason}`);
    }

    const reply =
      parsed.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim() ?? '';
    if (!reply) {
      throw new Error('Empty response from Gemini');
    }

    return { markdown: normalizeAssistantMarkdown(reply) };
  }
}
