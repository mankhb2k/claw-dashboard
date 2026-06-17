import { compileAgentsMd } from '@aucobot/workspace-sync/agent-workspace-compile';
import type { AgentFormInput } from '@/schemas/agent-form.schema';

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
  identity: `**Identity** — name, description, avatar emoji, tags, and vibe (professional / friendly / strict).

- Vibe shapes **SOUL.md** (tone) when the agent is saved.
- A short description sets the overall role; detailed behavior lives under **Instructions**.`,

  instructions: `**Instructions** — edit **AGENTS.md** (how the agent operates).

Two modes:
1. **Editor** — fill Role, Rules, Constraints, Output format; the backend compiles AGENTS.md on Save.
2. **Markdown** — edit AGENTS.md directly (Advanced) or preview (Simple).

Standard AGENTS.md structure:
\`\`\`markdown
# Role
Role description...

# Rules
- Rule 1
- Rule 2

# Constraints
- Safety limits...

# Output format
(Optional) Response format...
\`\`\`

Use this panel to draft markdown, then click **Apply to Instructions**.`,

  capabilities: `**Capabilities** — AI model, Docker sandbox, exec policy.

- **Model** — primary provider (Claude, GPT, Gemini…).
- **Sandbox** — run commands in a container; chat attachments are limited to ~5 MB when enabled.
- **Exec ask policy** — always / on-miss / off before running commands.
- **Safe bins** — allowlisted binaries (python, node…).
- **Timeout** — exec time limit in seconds.`,

  integrations: `**Integrations** — channels and connectors bound to this agent (Telegram, Slack, MCP…).

Integration config is project-wide; this tab links the agent to enabled channels.`,

  schedules: `**Schedules** — per-agent cron jobs (gateway cron).

Create recurring runs; requires a saved agent and a running gateway.`,

  heartbeat: `**Heartbeat** — periodic agent wake-ups (inbox checks, reminders…).

Enable/disable and set the interval; useful for always-on monitoring agents.`,
};

const WELCOME = `Hi! I am the **agent drafting assistant** — I help you write **AGENTS.md** and understand **Bot Agent** tabs.

You can:
- Ask *"what does the Capabilities tab do?"*
- Request *"write AGENTS.md for a customer support agent"*
- Send a role brief and I will suggest Role + Rules
- Use the quick prompts below the chat box

When I suggest markdown, use **Apply to Instructions** to push it into the form (Instructions tab → Markdown).`;

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

function extractTabIntent(text: string): EditTabGuide | null {
  const n = normalize(text);
  if (n.includes('identity') || n.includes('danh tinh') || n.includes('vibe')) return 'identity';
  if (n.includes('instruction') || n.includes('agents.md') || n.includes('agents md')) return 'instructions';
  if (n.includes('capabilit') || n.includes('sandbox') || n.includes('model')) return 'capabilities';
  if (n.includes('integrat') || n.includes('connector') || n.includes('kenh') || n.includes('channel')) return 'integrations';
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
  if (tabFromMsg && (n.includes('tab') || n.includes('huong dan') || n.includes('la gi') || n.includes('lam gi') || n.includes('guide') || n.includes('explain') || n.includes('what does'))) {
    return {
      id,
      role: 'assistant',
      content: TAB_GUIDES[tabFromMsg],
    };
  }

  if (n.includes('agents.md') && (n.includes('mau') || n.includes('sample') || n.includes('template') || n.includes('vi du') || n.includes('example'))) {
    const md = buildSampleAgentsMd(context);
    return {
      id,
      role: 'assistant',
      content: `Here is a **sample AGENTS.md** based on the current agent name/description. Edit it before applying:`,
      suggestedMarkdown: md,
      applyMode: 'advanced',
    };
  }

  if (
    n.includes('review') ||
    n.includes('xem lai') ||
    n.includes('kiem tra') ||
    n.includes('hien tai') ||
    n.includes('current')
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
          'Instructions form is empty. Fill Role in the Instructions tab or ask me for a sample AGENTS.md.',
      };
    }
    const tips: string[] = [];
    if (!current.includes('# Role')) tips.push('- Add a clear `# Role` heading.');
    if (!current.toLowerCase().includes('constraint') && !current.includes('# Constraints')) {
      tips.push('- Add `# Constraints` for safety limits.');
    }
    const tipBlock = tips.length ? `\n\n**Improvement tips:**\n${tips.join('\n')}` : '\n\nBasic structure looks fine — you can add more specific Rules.';
    return {
      id,
      role: 'assistant',
      content: `**Current AGENTS.md** (compiled from form):${tipBlock}`,
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
        'I drafted a proposed **AGENTS.md** from your description. Click **Apply** to send it to the Instructions tab (Advanced markdown or Editor depending on the button).',
      suggestedMarkdown: md,
      applyMode: 'advanced',
      applyFields: fields,
    };
  }

  if (activeTab && (n.includes('tab nay') || n.includes('this tab') || n.includes('o day') || n.includes('here'))) {
    return { id, role: 'assistant', content: TAB_GUIDES[activeTab] };
  }

  return {
    id,
    role: 'assistant',
    content: `I can help with:

1. **Tab guides** — e.g. "what does the Instructions tab do?"
2. **Draft AGENTS.md** — describe the agent role you want
3. **Sample AGENTS.md** — "give me a sample AGENTS.md"
4. **Review** — "review current AGENTS.md"

Left panel tab: **${activeTab ?? 'identity'}**. Ask about that tab or use a quick prompt below.`,
  };
}

export const QUICK_PROMPTS = [
  { id: 'guide-instructions', label: 'Instructions guide', message: 'Explain the Instructions tab and AGENTS.md' },
  { id: 'sample-md', label: 'Sample AGENTS.md', message: 'Give me a sample AGENTS.md' },
  { id: 'guide-capabilities', label: 'Sandbox & Capabilities', message: 'Explain the Capabilities tab and sandbox' },
  { id: 'review', label: 'Review current', message: 'Review current AGENTS.md' },
] as const;
