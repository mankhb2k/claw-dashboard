import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type HeartbeatAgentMode = 'off' | 'inherit' | 'custom';

export type ProjectHeartbeatRow = {
  heartbeatEnabled: boolean;
  heartbeatEvery: string;
  heartbeatMd: string | null;
};

export type AgentHeartbeatRow = {
  slug: string;
  enabled: boolean;
  heartbeatMode: string;
  heartbeatEvery: string | null;
  heartbeatMd: string | null;
};

const HEARTBEAT_EVERY_PATTERN = /^(\d+)(m|h|s)$/i;

export function validateHeartbeatEvery(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error('Heartbeat interval is required');
  }
  if (trimmed === '0m') {
    return '0m';
  }
  const match = HEARTBEAT_EVERY_PATTERN.exec(trimmed);
  if (!match) {
    throw new Error('Interval must match format like 15m, 1h, or 90s');
  }
  const amount = Number.parseInt(match[1] ?? '0', 10);
  const unit = (match[2] ?? 'm').toLowerCase();
  if (amount <= 0) {
    throw new Error('Interval must be greater than zero');
  }
  if (unit === 'm' && amount < 1) {
    throw new Error('Minimum interval is 1m');
  }
  if (unit === 's' && amount < 60) {
    throw new Error('Minimum interval is 60s');
  }
  return `${amount}${unit}`;
}

export function parseHeartbeatMode(value: string): HeartbeatAgentMode {
  if (value === 'inherit' || value === 'custom') {
    return value;
  }
  return 'off';
}

function buildHeartbeatBlock(every: string): Record<string, unknown> {
  return {
    every,
    target: 'none',
    isolatedSession: true,
    lightContext: true,
  };
}

export function resolveMainHeartbeatEvery(project: ProjectHeartbeatRow): string | null {
  if (!project.heartbeatEnabled) {
    return null;
  }
  const every = validateHeartbeatEvery(project.heartbeatEvery);
  if (every === '0m') {
    return null;
  }
  return every;
}

export function resolveAgentHeartbeatEvery(
  project: ProjectHeartbeatRow,
  agent: AgentHeartbeatRow,
): string | null {
  if (!agent.enabled) {
    return null;
  }
  const mode = parseHeartbeatMode(agent.heartbeatMode);
  if (mode === 'off') {
    return null;
  }
  if (mode === 'inherit') {
    return resolveMainHeartbeatEvery(project);
  }
  if (!agent.heartbeatEvery?.trim()) {
    return null;
  }
  const every = validateHeartbeatEvery(agent.heartbeatEvery);
  if (every === '0m') {
    return null;
  }
  return every;
}

function patchListEntryHeartbeat(
  list: Record<string, unknown>[],
  agentId: string,
  every: string | null,
): void {
  const entry = list.find((row) => row.id === agentId);
  if (!entry) {
    return;
  }
  if (!every) {
    delete entry.heartbeat;
    return;
  }
  entry.heartbeat = buildHeartbeatBlock(every);
}

/** Patch `agents.list[].heartbeat` after mergeAgentsIntoConfig (explicit-mode safe). */
export function mergeHeartbeatIntoConfig(
  config: Record<string, unknown>,
  project: ProjectHeartbeatRow,
  agents: AgentHeartbeatRow[],
): Record<string, unknown> {
  const agentsBlock = (config.agents as Record<string, unknown> | undefined) ?? {};
  const list = (agentsBlock.list as Record<string, unknown>[] | undefined) ?? [];

  const mainEvery = resolveMainHeartbeatEvery(project);
  patchListEntryHeartbeat(list, 'main', mainEvery);

  for (const agent of agents) {
    const every = resolveAgentHeartbeatEvery(project, agent);
    patchListEntryHeartbeat(list, agent.slug, every);
  }

  agentsBlock.list = list;
  config.agents = agentsBlock;
  return config;
}

async function writeHeartbeatMdFile(
  filePath: string,
  content: string | null | undefined,
): Promise<void> {
  const trimmed = content?.trim() ?? '';
  if (!trimmed) {
    try {
      await unlink(filePath);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException)?.code !== 'ENOENT') {
        throw err;
      }
    }
    return;
  }
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${trimmed}\n`, 'utf8');
}

export async function writeHeartbeatFiles(
  dataDir: string,
  project: ProjectHeartbeatRow,
  agents: AgentHeartbeatRow[],
): Promise<void> {
  await writeHeartbeatMdFile(
    path.join(dataDir, 'workspace', 'HEARTBEAT.md'),
    project.heartbeatMd,
  );

  for (const agent of agents) {
    if (!agent.enabled) {
      continue;
    }
    await writeHeartbeatMdFile(
      path.join(dataDir, `workspace-${agent.slug}`, 'HEARTBEAT.md'),
      agent.heartbeatMd,
    );
  }
}

export type HeartbeatSummaryEntry = {
  agentId: string;
  name: string;
  enabled: boolean;
  every: string | null;
  mode: HeartbeatAgentMode;
  source: 'main' | 'inherit' | 'custom' | 'off';
};

export function buildHeartbeatSummary(
  project: ProjectHeartbeatRow,
  agents: Array<AgentHeartbeatRow & { name: string }>,
): HeartbeatSummaryEntry[] {
  const mainEvery = resolveMainHeartbeatEvery(project);
  const rows: HeartbeatSummaryEntry[] = [
    {
      agentId: 'main',
      name: 'Main',
      enabled: mainEvery !== null,
      every: mainEvery,
      mode: 'custom',
      source: 'main',
    },
  ];

  for (const agent of agents) {
    const mode = parseHeartbeatMode(agent.heartbeatMode);
    const every = resolveAgentHeartbeatEvery(project, agent);
    const source: HeartbeatSummaryEntry['source'] =
      mode === 'inherit' ? 'inherit' : mode === 'custom' ? 'custom' : 'off';
    rows.push({
      agentId: agent.slug,
      name: agent.name,
      enabled: every !== null,
      every,
      mode,
      source,
    });
  }

  return rows;
}
