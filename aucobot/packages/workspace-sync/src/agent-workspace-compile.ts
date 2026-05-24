import type { AgentFormInput, AgentVibe } from './agent-form.types.js';

export const BOOTSTRAP_MAX_CHARS_PER_FILE = 12_000;
export const BOOTSTRAP_MAX_CHARS_TOTAL = 60_000;

export type AgentBootstrapFilename = 'AGENTS.md' | 'SOUL.md' | 'IDENTITY.md' | 'TOOLS.md';

export type AgentBootstrapFiles = Record<AgentBootstrapFilename, string>;

export interface AgentBootstrapBundle {
  files: AgentBootstrapFiles;
  meta: {
    charCounts: Record<AgentBootstrapFilename, number>;
    totalChars: number;
    warnings: string[];
  };
}

/** OpenClaw worker schema — xem openclaw-architecture.md §13.3 / §25. */
export type OpenClawAgentSandbox = {
  mode: 'all' | 'non-main';
  scope: 'agent' | 'session';
};

export interface OpenClawAgentConfigPatch {
  model: { primary: string };
  sandbox?: OpenClawAgentSandbox;
  exec: {
    ask: 'always' | 'on-miss' | 'off';
    safeBins: string[];
    timeoutSec: number;
  };
}

export interface AgentWorkspaceBundle {
  bootstrap: AgentBootstrapBundle;
  config: OpenClawAgentConfigPatch;
}

const VIBE_SOUL_LINES: Record<AgentVibe, string[]> = {
  professional: [
    'Giao tiếp chuyên nghiệp, lịch sự và rõ ràng.',
    'Trả lời súc tích, đi thẳng vào nội dung.',
    'Tránh mở đầu sáo rỗng như "Great question!" hoặc "Absolutely."',
  ],
  friendly: [
    'Giọng điệu thân thiện, cởi mở và dễ gần.',
    'Giải thích đơn giản, kiên nhẫn khi người dùng chưa rõ.',
    'Có thể dùng emoji nhẹ nhàng khi phù hợp ngữ cảnh.',
  ],
  strict: [
    'Giọng điệu khắt khe, chính xác và logic.',
    'Ưu tiên sự thật và quy trình hơn câu chữ hoa mỉ.',
    'Chỉ ra sai sót sớm; không làm mềm thông tin quan trọng.',
  ],
};

const TOOLS_EMPTY_STUB = `# TOOLS.md - Ghi chú công cụ

Không có ghi chú tool đặc thù cho workspace này.
`;

function linesToBullets(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (line.startsWith('-') ? line : `- ${line}`));
}

function trimToLimit(content: string, maxChars: number): { text: string; truncated: boolean } {
  const trimmed = content.trimEnd();
  if (trimmed.length <= maxChars) {
    return { text: trimmed, truncated: false };
  }
  return {
    text: `${trimmed.slice(0, maxChars)}\n\n[...đã cắt bớt theo giới hạn ${maxChars} ký tự...]`,
    truncated: true,
  };
}

export function compileIdentityMd(
  input: Pick<AgentFormInput, 'name' | 'description' | 'avatar' | 'tags'>,
): string {
  const tagLine =
    input.tags.length > 0 ? input.tags.map((t) => `\`${t}\``).join(', ') : '_(chưa có)_';

  return [
    '# Identity',
    '',
    `- **Name:** ${input.name.trim()}`,
    `- **Emoji:** ${input.avatar.trim()}`,
    `- **Summary:** ${input.description.trim() || '_(chưa có mô tả)_'}`,
    `- **Tags:** ${tagLine}`,
  ].join('\n');
}

export function compileSoulMd(input: Pick<AgentFormInput, 'vibe'>): string {
  const lines = VIBE_SOUL_LINES[input.vibe];
  return ['# SOUL.md - Giọng điệu', '', '## Core', '', ...lines.map((l) => `- ${l}`), ''].join('\n');
}

export function compileAgentsMd(
  input: Pick<
    AgentFormInput,
    | 'instructionsMode'
    | 'instructionsRole'
    | 'instructionsRules'
    | 'instructionsConstraints'
    | 'instructionsOutputFormat'
    | 'instructionsAdvanced'
  >,
): string {
  if (input.instructionsMode === 'advanced') {
    return input.instructionsAdvanced.trim();
  }

  const parts: string[] = [];
  parts.push('# Vai trò', '', input.instructionsRole.trim(), '');

  const rules = linesToBullets(input.instructionsRules);
  if (rules.length > 0) {
    parts.push('# Quy tắc', '', ...rules, '');
  }

  const constraints = linesToBullets(input.instructionsConstraints);
  if (constraints.length > 0) {
    parts.push('# Giới hạn', '', ...constraints, '');
  }

  const output = input.instructionsOutputFormat.trim();
  if (output) {
    parts.push('# Định dạng đầu ra', '', output, '');
  }

  return parts.join('\n').trim();
}

export function compileToolsMd(input: Pick<AgentFormInput, 'toolsNotes'>): string {
  const notes = input.toolsNotes.trim();
  if (!notes) {
    return TOOLS_EMPTY_STUB;
  }
  return ['# TOOLS.md - Ghi chú công cụ', '', '## Ghi chú môi trường', '', notes].join('\n').trim();
}

function normalizeModelPrimary(model: string): string {
  const m = model.trim();
  if (!m || m.includes('/')) {
    return m;
  }
  if (/^gpt-|^o\d/i.test(m)) {
    return `openai/${m}`;
  }
  if (/^claude-/i.test(m)) {
    return `anthropic/${m}`;
  }
  if (/^gemini-/i.test(m)) {
    return `google/${m}`;
  }
  return m;
}

export function compileOpenClawAgentConfig(
  input: Pick<AgentFormInput, 'model' | 'sandboxEnabled' | 'askPolicy' | 'safeBins' | 'timeoutSec'>,
): OpenClawAgentConfigPatch {
  const patch: OpenClawAgentConfigPatch = {
    model: { primary: normalizeModelPrimary(input.model) },
    exec: {
      ask: input.askPolicy,
      safeBins: input.safeBins,
      timeoutSec: input.timeoutSec,
    },
  };
  if (input.sandboxEnabled) {
    patch.sandbox = { mode: 'all', scope: 'agent' };
  }
  return patch;
}

export function compileAgentBootstrap(input: AgentFormInput): AgentBootstrapBundle {
  const warnings: string[] = [];
  const raw: AgentBootstrapFiles = {
    'AGENTS.md': compileAgentsMd(input),
    'SOUL.md': compileSoulMd(input),
    'IDENTITY.md': compileIdentityMd(input),
    'TOOLS.md': compileToolsMd(input),
  };

  const files = {} as AgentBootstrapFiles;
  const charCounts = {} as Record<AgentBootstrapFilename, number>;

  for (const name of Object.keys(raw) as AgentBootstrapFilename[]) {
    const { text, truncated } = trimToLimit(raw[name], BOOTSTRAP_MAX_CHARS_PER_FILE);
    files[name] = text;
    charCounts[name] = text.length;
    if (truncated) {
      warnings.push(`${name} vượt ${BOOTSTRAP_MAX_CHARS_PER_FILE} ký tự và đã bị cắt bớt.`);
    }
  }

  const totalChars = Object.values(charCounts).reduce((sum, n) => sum + n, 0);
  if (totalChars > BOOTSTRAP_MAX_CHARS_TOTAL) {
    warnings.push(
      `Tổng bootstrap (${totalChars}) vượt ${BOOTSTRAP_MAX_CHARS_TOTAL} ký tự — OpenClaw có thể truncate khi inject.`,
    );
  }

  return { files, meta: { charCounts, totalChars, warnings } };
}

export function compileAgentWorkspace(input: AgentFormInput): AgentWorkspaceBundle {
  return {
    bootstrap: compileAgentBootstrap(input),
    config: compileOpenClawAgentConfig(input),
  };
}
