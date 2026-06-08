import { compileAgentsMd } from '@aucobot/workspace-sync/agent-workspace-compile';
import type { AgentFormInput } from '@/schemas/agentForm.schema';

export type AgentPanelApplyFields = {
  instructionsRole?: string;
  instructionsRules?: string;
  instructionsConstraints?: string;
  instructionsOutputFormat?: string;
};

export type AgentPanelMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedMarkdown?: string;
  applyMode?: 'advanced' | 'simple';
  applyFields?: AgentPanelApplyFields;
};

export type EditTabGuide =
  | 'identity'
  | 'instructions'
  | 'capabilities'
  | 'integrations'
  | 'schedules'
  | 'heartbeat';

const TAB_GUIDES: Record<EditTabGuide, string> = {
  identity: `**Identity** — tên, mô tả, avatar emoji, tags và vibe (professional / friendly / strict).

- Vibe ảnh hưởng **SOUL.md** (giọng điệu) khi lưu agent.
- Mô tả ngắn giúp agent hiểu vai trò tổng quát; chi tiết hành vi nằm ở **Instructions**.`,

  instructions: `**Instructions** — biên soạn **AGENTS.md** (quy tắc vận hành agent).

Hai chế độ:
1. **Editor** — điền Role, Rules, Constraints, Output format; backend compile thành AGENTS.md khi Save.
2. **Markdown** — chỉnh trực tiếp AGENTS.md (Advanced) hoặc xem preview (Simple).

Cấu trúc AGENTS.md chuẩn:
\`\`\`markdown
# Role
Mô tả vai trò...

# Rules
- Quy tắc 1
- Quy tắc 2

# Constraints
- Giới hạn an toàn...

# Output format
(Tùy chọn) Định dạng trả lời...
\`\`\`

Dùng panel này để soạn/thảo markdown rồi bấm **Áp dụng vào Instructions**.`,

  capabilities: `**Capabilities** — model AI, sandbox Docker, exec policy.

- **Model** — provider chính (Claude, GPT, Gemini…).
- **Sandbox** — chạy lệnh trong container; giới hạn file đính kèm chat ~5 MB khi bật.
- **Exec ask policy** — always / on-miss / off trước khi chạy lệnh.
- **Safe bins** — allowlist binary (python, node…).
- **Timeout** — giới hạn thời gian exec (giây).`,

  integrations: `**Integrations** — kênh và connector gắn với agent (Telegram, Slack, MCP…).

Cấu hình tích hợp theo project; tab này liên kết agent với kênh đã bật.`,

  schedules: `**Schedules** — cron job theo agent (gateway cron).

Tạo lịch chạy định kỳ; cần agent đã lưu và gateway hoạt động.`,

  heartbeat: `**Heartbeat** — agent tự “thở” định kỳ (kiểm tra inbox, nhắc việc…).

Bật/tắt và cấu hình interval; phù hợp agent giám sát liên tục.`,
};

const WELCOME = `Xin chào! Tôi là **trợ lý soạn agent** — giúp bạn viết **AGENTS.md** và hiểu các tab **Bot Agent**.

Bạn có thể:
- Hỏi *"tab Capabilities làm gì?"*
- Nhờ *"viết AGENTS.md cho agent support khách hàng"*
- Gửi mô tả vai trò để tôi đề xuất Role + Rules
- Bấm nút gợi ý bên dưới ô chat

Khi tôi đề xuất markdown, dùng **Áp dụng vào Instructions** để đưa vào form (tab Instructions → Markdown).`;

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

function extractTabIntent(text: string): EditTabGuide | null {
  const n = normalize(text);
  if (n.includes('identity') || n.includes('danh tinh') || n.includes('vibe')) return 'identity';
  if (n.includes('instruction') || n.includes('agents.md') || n.includes('agents md')) return 'instructions';
  if (n.includes('capabilit') || n.includes('sandbox') || n.includes('model')) return 'capabilities';
  if (n.includes('integrat') || n.includes('connector') || n.includes('kenh')) return 'integrations';
  if (n.includes('schedule') || n.includes('cron') || n.includes('lich')) return 'schedules';
  if (n.includes('heartbeat') || n.includes('nhip tim')) return 'heartbeat';
  return null;
}

function buildSampleAgentsMd(context: Partial<AgentFormInput>): string {
  const name = context.name?.trim() || 'Assistant Agent';
  const desc = context.description?.trim() || 'support users in this project';

  return `# Role
You are **${name}** — ${desc}.

# Rules
- Answer clearly and stay on topic for the user's request.
- Confirm before destructive or irreversible actions.
- Use available tools when they improve accuracy; cite sources when searching the web.

# Constraints
- Never expose secrets, API keys, or private credentials.
- Do not run dangerous shell commands outside sandbox policy.
- Respect project collaboration boundaries when routing to other agents.

# Output format
- Prefer concise bullets for lists; use short paragraphs for explanations.
- Match the user's language when possible.`;
}

function buildFromUserBrief(userText: string, context: Partial<AgentFormInput>): string {
  const roleLine = userText.trim().slice(0, 500);
  const name = context.name?.trim() || 'Agent';

  return `# Role
${roleLine || `You are ${name}, a helpful assistant in this project.`}

# Rules
- Follow the role above in every reply.
- Ask one clarifying question when the request is ambiguous.
- Prefer actionable steps over vague promises.

# Constraints
- Do not disclose sensitive project data.
- Do not bypass sandbox or exec policies configured in Capabilities.

# Output format
- Keep answers structured; use markdown headings when the reply is long.`;
}

function parseSimpleFieldsFromMarkdown(md: string): AgentPanelApplyFields {
  const sections: Record<string, string> = {};
  const lines = md.split('\n');
  let current: string | null = null;
  const buf: string[] = [];

  const flush = () => {
    if (current) sections[current] = buf.join('\n').trim();
    buf.length = 0;
  };

  for (const line of lines) {
    const h = line.match(/^#\s+(.+)/);
    if (h) {
      flush();
      current = h[1]!.trim().toLowerCase();
      continue;
    }
    if (current) buf.push(line);
  }
  flush();

  return {
    instructionsRole: sections.role ?? '',
    instructionsRules: sections.rules ?? '',
    instructionsConstraints: sections.constraints ?? '',
    instructionsOutputFormat: sections['output format'] ?? '',
  };
}

export function getWelcomeMessage(): AgentPanelMessage {
  return { id: 'welcome', role: 'assistant', content: WELCOME };
}

export function respondToUserMessage(
  userText: string,
  context: Partial<AgentFormInput>,
  activeTab?: EditTabGuide,
): AgentPanelMessage {
  const n = normalize(userText);
  const id = `a-${Date.now()}`;

  const tabFromMsg = extractTabIntent(userText);
  if (tabFromMsg && (n.includes('tab') || n.includes('huong dan') || n.includes('là gì') || n.includes('lam gi') || n.includes('guide') || n.includes('explain'))) {
    return {
      id,
      role: 'assistant',
      content: TAB_GUIDES[tabFromMsg],
    };
  }

  if (n.includes('agents.md') && (n.includes('mau') || n.includes('sample') || n.includes('template') || n.includes('vi du'))) {
    const md = buildSampleAgentsMd(context);
    return {
      id,
      role: 'assistant',
      content: `Đây là **AGENTS.md mẫu** dựa trên tên/mô tả agent hiện tại. Chỉnh lại trước khi áp dụng:`,
      suggestedMarkdown: md,
      applyMode: 'advanced',
    };
  }

  if (
    n.includes('review') ||
    n.includes('xem lai') ||
    n.includes('kiem tra') ||
    n.includes('hien tai')
  ) {
    const current = compileAgentsMd({
      instructionsMode: context.instructionsMode ?? 'simple',
      instructionsRole: context.instructionsRole ?? '',
      instructionsRules: context.instructionsRules ?? '',
      instructionsConstraints: context.instructionsConstraints ?? '',
      instructionsOutputFormat: context.instructionsOutputFormat ?? '',
      instructionsAdvanced: context.instructionsAdvanced ?? '',
    });
    if (!current.trim()) {
      return {
        id,
        role: 'assistant',
        content:
          'Form Instructions đang trống. Hãy điền Role trong tab Instructions hoặc nhờ tôi tạo AGENTS.md mẫu.',
      };
    }
    const tips: string[] = [];
    if (!current.includes('# Role')) tips.push('- Thêm heading `# Role` rõ ràng.');
    if (!current.toLowerCase().includes('constraint') && !current.includes('# Constraints')) {
      tips.push('- Nên có `# Constraints` cho giới hạn an toàn.');
    }
    const tipBlock = tips.length ? `\n\n**Gợi ý cải thiện:**\n${tips.join('\n')}` : '\n\nCấu trúc cơ bản ổn — có thể bổ sung Rules cụ thể hơn.';
    return {
      id,
      role: 'assistant',
      content: `**AGENTS.md hiện tại** (compile từ form):${tipBlock}`,
      suggestedMarkdown: current,
      applyMode: context.instructionsMode === 'advanced' ? 'advanced' : 'simple',
    };
  }

  if (
    n.includes('viet') ||
    n.includes('tao') ||
    n.includes('generate') ||
    n.includes('write') ||
    n.includes('draft') ||
    n.includes('optimize') ||
    n.includes('toi uu')
  ) {
    const md = buildFromUserBrief(userText, context);
    const fields = parseSimpleFieldsFromMarkdown(md);
    return {
      id,
      role: 'assistant',
      content:
        'Tôi đã soạn đề xuất **AGENTS.md** từ mô tả của bạn. Bấm **Áp dụng** để đưa vào tab Instructions (chế độ Markdown nâng cao hoặc Editor tùy nút).',
      suggestedMarkdown: md,
      applyMode: 'advanced',
      applyFields: fields,
    };
  }

  if (activeTab && (n.includes('tab nay') || n.includes('this tab') || n.includes('o day'))) {
    return { id, role: 'assistant', content: TAB_GUIDES[activeTab] };
  }

  return {
    id,
    role: 'assistant',
    content: `Tôi có thể giúp:

1. **Hướng dẫn tab** — ví dụ: "tab Instructions làm gì?"
2. **Soạn AGENTS.md** — mô tả vai trò agent bạn muốn
3. **Mẫu AGENTS.md** — "cho tôi mẫu AGENTS.md"
4. **Review** — "review AGENTS.md hiện tại"

Tab đang mở bên trái: **${activeTab ?? 'identity'}**. Hỏi về tab đó hoặc dùng nút gợi ý bên dưới.`,
  };
}

export const QUICK_PROMPTS = [
  { id: 'guide-instructions', label: 'Hướng dẫn Instructions', message: 'Giải thích tab Instructions và AGENTS.md' },
  { id: 'sample-md', label: 'Mẫu AGENTS.md', message: 'Cho tôi mẫu AGENTS.md' },
  { id: 'guide-capabilities', label: 'Sandbox & Capabilities', message: 'Giải thích tab Capabilities và sandbox' },
  { id: 'review', label: 'Review hiện tại', message: 'Review AGENTS.md hiện tại' },
] as const;
