import {
  AGENT_AI_EDITOR_MAX_OUTPUT_TOKENS,
  AGENT_AI_EDITOR_TIMEOUT_MS,
} from './agent-ai-editor.constants';
import { toNativeModelId } from '../skill-ai-editor/providers/model-id.util';
import type { AgentAiEditorMessage } from './agent-ai-editor.types';

type OpenAiChatResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
};

type GeminiGenerateResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  promptFeedback?: { blockReason?: string };
};

export async function completeAgentAiEditorRaw(params: {
  providerId: string;
  apiKey: string;
  model: string;
  system: string;
  messages: AgentAiEditorMessage[];
}): Promise<string> {
  if (params.providerId === 'openai') {
    return completeOpenAi(params);
  }
  if (params.providerId === 'gemini') {
    return completeGemini(params);
  }
  throw new Error(`Unsupported provider: ${params.providerId}`);
}

async function completeOpenAi(params: {
  apiKey: string;
  model: string;
  system: string;
  messages: AgentAiEditorMessage[];
}): Promise<string> {
  const modelId = toNativeModelId(params.model, 'openai');
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: params.system },
    ...params.messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.apiKey}`,
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
  return reply;
}

async function completeGemini(params: {
  apiKey: string;
  model: string;
  system: string;
  messages: AgentAiEditorMessage[];
}): Promise<string> {
  const modelId = toNativeModelId(params.model, 'google');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(params.apiKey)}`;

  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
  for (const msg of params.messages) {
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    });
  }

  const body = {
    systemInstruction: { parts: [{ text: params.system }] },
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
    parsed.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim() ?? '';
  if (!reply) throw new Error('Empty response from Gemini');
  return reply;
}
