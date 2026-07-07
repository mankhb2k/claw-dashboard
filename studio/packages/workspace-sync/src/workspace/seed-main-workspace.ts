import { access, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  compileAgentBootstrap,
  type AgentBootstrapFilename,
} from '../agents/agent-workspace-compile.js';
import type { AgentFormInput } from '../agents/agent-form.types.js';

const BOOTSTRAP_MARKERS = [
  'AGENTS.md',
  'SOUL.md',
  'IDENTITY.md',
  'TOOLS.md',
  'BOOTSTRAP.md',
] as const;

/** Default bootstrap for implicit `main` agent (`agents.list[].id === "main"`). */
export const DEFAULT_MAIN_AGENT_FORM: AgentFormInput = {
  name: 'Main',
  description: 'Default assistant',
  avatar: '',
  tags: [],
  vibe: 'friendly',
  instructionsMode: 'simple',
  instructionsRole: 'You are a helpful assistant.',
  instructionsRules: '',
  instructionsConstraints: '',
  instructionsOutputFormat: '',
  instructionsAdvanced: '',
  toolsNotes: '',
  model: '',
  shellExecEnabled: true,
  skillNames: [],
};

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function hasWorkspaceBootstrapFiles(
  workspaceDir: string,
): Promise<boolean> {
  for (const name of BOOTSTRAP_MARKERS) {
    if (await pathExists(path.join(workspaceDir, name))) {
      return true;
    }
  }
  return false;
}

async function clearWorkspaceAttestations(dataDir: string): Promise<boolean> {
  const attestationDir = path.join(dataDir, 'workspace-attestations');
  if (!(await pathExists(attestationDir))) {
    return false;
  }

  let entries: string[];
  try {
    entries = await readdir(attestationDir);
  } catch {
    return false;
  }

  const attested = entries.filter((name) => name.endsWith('.attested'));
  if (attested.length === 0) {
    return false;
  }

  for (const name of attested) {
    await rm(path.join(attestationDir, name), { force: true });
  }
  return true;
}

/**
 * Write main-agent markdown bootstrap files into `{dataDir}/workspace/`.
 * Skips when any bootstrap marker file already exists.
 */
export async function seedMainAgentWorkspace(dataDir: string): Promise<boolean> {
  const workspaceDir = path.join(dataDir, 'workspace');
  if (await hasWorkspaceBootstrapFiles(workspaceDir)) {
    return false;
  }

  const bundle = compileAgentBootstrap(DEFAULT_MAIN_AGENT_FORM);
  for (const name of Object.keys(bundle.files) as AgentBootstrapFilename[]) {
    await writeFile(path.join(workspaceDir, name), bundle.files[name], 'utf8');
  }
  return true;
}

/**
 * OSS desktop/compose: gateway expects `/home/node/.openclaw/workspace` (see
 * openclaw.json) while API writes under `{dataRoot}/default/workspace`.
 * Entrypoint symlinks bridge the paths; this repairs empty workspaces and
 * clears stale attestations that block chat (`WorkspaceVanishedError`).
 *
 * @returns true when disk state was modified.
 */
export async function repairOssProjectWorkspace(
  dataDir: string,
): Promise<boolean> {
  const workspaceDir = path.join(dataDir, 'workspace');
  const hadBootstrap = await hasWorkspaceBootstrapFiles(workspaceDir);
  let changed = false;

  if (!hadBootstrap) {
    changed = (await seedMainAgentWorkspace(dataDir)) || changed;
    changed = (await clearWorkspaceAttestations(dataDir)) || changed;
  }

  return changed;
}
