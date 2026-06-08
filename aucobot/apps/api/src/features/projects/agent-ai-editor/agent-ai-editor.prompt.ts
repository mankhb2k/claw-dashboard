import type { AgentContextForPrompt } from './agent-ai-editor.types';

export function buildAgentAiEditorSystemPrompt(params: {
  intent: 'optimize' | 'chat';
  agentContext: AgentContextForPrompt;
}): string {
  const ctx = params.agentContext;
  const tagLine = ctx.tags.length ? ctx.tags.join(', ') : '(none)';

  const contextBlock = [
    'Agent metadata:',
    `- name: ${ctx.name}`,
    `- description: ${ctx.description || '(empty)'}`,
    `- vibe: ${ctx.vibe}`,
    `- tags: ${tagLine}`,
    `- instructions mode: ${ctx.instructionsMode}`,
    ctx.activeEditTab ? `- active editor tab: ${ctx.activeEditTab}` : '',
    '',
    'Current AGENTS.md draft:',
    '---',
    ctx.currentAgentsMd.trim().slice(0, 12_000) || '(empty)',
    '---',
  ]
    .filter(Boolean)
    .join('\n');

  if (params.intent === 'chat') {
    return [
      'You help users configure OpenClaw Bot Agent (AGENTS.md and editor tabs).',
      'Answer in the same language as the user (Vietnamese or English).',
      'Be concise. Explain Identity, Instructions, Capabilities, Integrations, Schedules, Heartbeat when asked.',
      '',
      'Respond with JSON only (no markdown fences):',
      '{"phase":"clarify","message":"...","questions":[]}',
      'Use phase "clarify" with empty questions when answering normally; put your answer in message.',
      'Do NOT output AGENTS.md unless user explicitly asks to optimize/draft instructions.',
      '',
      contextBlock,
    ].join('\n');
  }

  return [
    'You optimize OpenClaw AGENTS.md (agent operating instructions).',
    'Rules:',
    '- Respond with a single JSON object only. No ``` fences. No prose outside JSON.',
    '- Schema:',
    '  clarify: {"phase":"clarify","message":"short intro","questions":["q1","q2"]}',
    '  optimize: {"phase":"optimize","message":"short summary","markdown":"full AGENTS.md"}',
    '- Ask 1-3 focused questions (like Cursor plan) when role, audience, scope, safety constraints, or output format are unclear.',
    '- When enough context exists (from agent metadata, current draft, or chat), output phase "optimize".',
    '- markdown must use headings: # Role, # Rules, # Constraints, optional # Output format',
    '- Write in the same language as the user.',
    '- Do not include YAML frontmatter.',
    '',
    contextBlock,
  ].join('\n');
}

/** Parse model JSON output into structured result. */
export function parseAgentAiEditorResponse(raw: string): {
  phase: 'clarify' | 'optimize';
  message: string;
  questions?: string[];
  markdown?: string;
} {
  let text = raw.trim();
  const fence = /^```(?:json)?\s*\n([\s\S]*?)\n```$/i;
  const m = text.match(fence);
  if (m) {
    text = m[1].trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('AI response was not valid JSON');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('AI response JSON must be an object');
  }

  const obj = parsed as Record<string, unknown>;
  const phase = obj.phase;
  if (phase !== 'clarify' && phase !== 'optimize') {
    throw new Error('AI response missing valid phase');
  }

  const message = typeof obj.message === 'string' ? obj.message.trim() : '';
  if (!message) {
    throw new Error('AI response missing message');
  }

  if (phase === 'clarify') {
    const questions = Array.isArray(obj.questions)
      ? obj.questions
          .filter((q): q is string => typeof q === 'string' && q.trim().length > 0)
          .map((q) => q.trim())
          .slice(0, 3)
      : [];
    return { phase, message, questions: questions.length ? questions : undefined };
  }

  const markdown = typeof obj.markdown === 'string' ? obj.markdown.trim() : '';
  if (!markdown) {
    throw new Error('Optimize phase requires markdown');
  }
  return { phase, message, markdown };
}
