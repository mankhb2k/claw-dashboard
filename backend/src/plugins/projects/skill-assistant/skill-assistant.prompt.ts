export type SkillContextForPrompt = {
  slug: string;
  name: string;
  description: string;
  heading?: string | null;
  currentBodyMarkdown?: string;
};

export function buildSkillAssistantSystemPrompt(ctx: SkillContextForPrompt): string {
  const lines = [
    'You help the user write the BODY of an OpenClaw Agent Skill (markdown only).',
    'Rules:',
    '- Output ONLY the skill body markdown. No YAML frontmatter (no --- blocks).',
    '- Do NOT wrap output in ```markdown or ``` fences.',
    '- Use clear headings (# or ##), lists, and code blocks when useful.',
    '- Write in the same language the user uses (Vietnamese or English).',
    '- The skill instructs an AI agent how to behave when this skill is selected.',
    '',
    'Skill metadata (for context only — do not repeat as frontmatter):',
    `- slug: ${ctx.slug}`,
    `- name: ${ctx.name}`,
    `- description: ${ctx.description}`,
  ];
  if (ctx.heading?.trim()) {
    lines.push(`- document heading hint: ${ctx.heading.trim()}`);
  }
  if (ctx.currentBodyMarkdown?.trim()) {
    lines.push(
      '',
      'Current draft body (user may ask to improve or extend):',
      '---',
      ctx.currentBodyMarkdown.trim().slice(0, 12_000),
      '---',
    );
  }
  return lines.join('\n');
}

/** Strip accidental markdown fences from model output. */
export function normalizeAssistantMarkdown(raw: string): string {
  let text = raw.trim();
  const fence = /^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/i;
  const m = text.match(fence);
  if (m) {
    text = m[1].trim();
  }
  return text;
}
