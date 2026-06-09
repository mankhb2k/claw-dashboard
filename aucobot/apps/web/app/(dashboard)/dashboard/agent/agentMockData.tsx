export interface AgentItem {
  id: string;
  name: string;
  avatar: string;
  description: string;
  model: string;
  skillsCount: number;
  isActive: boolean;
  inCollaboration?: boolean;
}

export const INITIAL_AGENTS: AgentItem[] = [
  {
    id: "agent-1",
    name: "Customer Support",
    avatar: "🤖",
    description: "Answers questions and provides automated customer support across chat channels.",
    model: "Claude 3.5 Sonnet",
    skillsCount: 3,
    isActive: true,
  },
  {
    id: "agent-2",
    name: "Data Analyst",
    avatar: "📊",
    description: "Analyzes metrics and extracts smart reports from your data sources.",
    model: "GPT-4o",
    skillsCount: 5,
    isActive: true,
  },
  {
    id: "agent-3",
    name: "Sales Assistant",
    avatar: "💼",
    description: "Recommends products, quotes prices, and helps close orders quickly.",
    model: "Gemini 1.5 Pro",
    skillsCount: 2,
    isActive: false,
  },
];

export interface AgentTemplate {
  id: string;
  name: string;
  avatar: string;
  description: string;
  model: string;
  vibe: 'professional' | 'friendly' | 'strict';
  toolsProfile: 'full' | 'coding' | 'messaging' | 'minimal';
  sandboxEnabled: boolean;
  bootstrapFiles: {
    identity: string;
    soul: string;
    agents: string;
  };
}

export const INITIAL_TEMPLATES: AgentTemplate[] = [
  {
    id: "empty",
    name: "Custom Agent",
    avatar: "⚙️",
    description: "Configure everything from scratch. Best for experts who want their own logic.",
    model: "claude-3-5-sonnet",
    vibe: "professional",
    toolsProfile: "minimal",
    sandboxEnabled: false,
    bootstrapFiles: {
      identity: "# Agent name\n- General description of the assistant.",
      soul: "# SOUL.md\n- Define personality and ethical boundaries.",
      agents: "# AGENTS.md\n- Execution rules and support playbooks.",
    },
  },
  {
    id: "customer-support",
    name: "Customer Support Assistant",
    avatar: "🤖",
    description: "Polite communication, Q&A, request triage, and strong conversation memory.",
    model: "gemini-1-5-pro",
    vibe: "friendly",
    toolsProfile: "messaging",
    sandboxEnabled: false,
    bootstrapFiles: {
      identity: "# Customer Support Assistant\n- Emoji: 🤖\n- Style: Kind, attentive, thorough.",
      soul: "# SOUL.md\n- You represent OpenClaw technical support and customer care.\n- Stay patient, empathetic, and calm frustrated customers.",
      agents: "# AGENTS.md\n- Answer product and service questions.\n- Triage user requests and escalate to engineering when needed.\n- Use memory_search to recall customer history across sessions.",
    },
  },
  {
    id: "coding-assistant",
    name: "AI Software Engineer",
    avatar: "💻",
    description: "Read, edit, and write clean code with deep filesystem integration for automation and debugging.",
    model: "claude-3-5-sonnet",
    vibe: "strict",
    toolsProfile: "coding",
    sandboxEnabled: true,
    bootstrapFiles: {
      identity: "# AI Software Engineer\n- Emoji: 💻\n- Style: Concise, technical, logical.",
      soul: "# SOUL.md\n- You are a senior engineer writing clean, industry-standard code.\n- Go straight to the technical solution; avoid filler language.",
      agents: "# AGENTS.md\n- Use filesystem tools (read/write/edit/apply_patch) to inspect and change source code.\n- Verify integrity and run code before marking a task complete.\n- Add brief inline comments where helpful.",
    },
  },
  {
    id: "data-analyst",
    name: "Research & Analytics Specialist",
    avatar: "📊",
    description: "Real-time web research, document reading, data analysis, and visual reporting.",
    model: "gpt-4o",
    vibe: "professional",
    toolsProfile: "full",
    sandboxEnabled: true,
    bootstrapFiles: {
      identity: "# Research & Analytics Specialist\n- Emoji: 📊\n- Style: Scientific, objective, evidence-based.",
      soul: "# SOUL.md\n- You are a market researcher and data analyst.\n- Only state verifiable facts; avoid subjective guesses.",
      agents: "# AGENTS.md\n- Use web_search for up-to-date information.\n- Use browser for deep scraping and code_execution for CSV/Excel analysis.\n- Deliver structured reports with clear tables.",
    },
  },
  {
    id: "orchestrator",
    name: "Multi-Agent Orchestrator",
    avatar: "🧠",
    description: "Break complex work into subtasks and delegate to the right sub-agents.",
    model: "gemini-1-5-pro",
    vibe: "professional",
    toolsProfile: "full",
    sandboxEnabled: false,
    bootstrapFiles: {
      identity: "# Multi-Agent Orchestrator\n- Emoji: 🧠\n- Style: Visionary, organized, strong coordinator.",
      soul: "# SOUL.md\n- You lead a multi-agent system.\n- Maximize efficiency by delegating to specialized sub-agents.",
      agents: "# AGENTS.md\n- Split complex user requests into subtasks.\n- Use subagents to call specialists (e.g. coding or research agents).\n- Cross-check sub-agent results before delivering the final report.",
    },
  },
];

export interface ApiKeyItem {
  id: string;
  name: string;
  token: string;
  createdAt: string;
}

export interface FacebookConfig {
  pageId: string;
  pageAccessToken: string;
  webhookUrl: string;
  verifyToken: string;
  isConnected: boolean;
}

export const MOCK_API_KEYS: ApiKeyItem[] = [
  {
    id: "key-1",
    name: "Website Chatbot (Production)",
    token: "sk-claw-w8a927c6b12f45ea9834bc6293f3c12a",
    createdAt: "2026-05-18",
  },
  {
    id: "key-2",
    name: "REST API Integration",
    token: "sk-claw-m5b8210cd45a8356782ffce111aa990b",
    createdAt: "2026-05-19",
  }
];

// ─── Agent ↔ Channel (mock until API persists per agent) ───────────────────
/** Which channelIds this agent listens on (channel config lives under Channels). */

export interface AgentChannelAssignment {
  channelId: string;
  isActive: boolean;
}

export const MOCK_AGENT_CHANNEL_TOOLS: AgentChannelAssignment[] = [
  { channelId: "telegram", isActive: true },
  { channelId: "facebook-messenger", isActive: true },
];

// ─── Agent ↔ Connector tools (mock until API persists per agent) ───────────
/** Which connector slugs this agent may call (details under Connect tab). */

export interface AgentConnectorToolAssignment {
  connectorSlug: string;
  isActive: boolean;
}

export const MOCK_AGENT_CONNECTOR_TOOLS: AgentConnectorToolAssignment[] = [
  { connectorSlug: "google-drive", isActive: true },
  { connectorSlug: "notion", isActive: true },
  { connectorSlug: "shopee", isActive: true },
];

