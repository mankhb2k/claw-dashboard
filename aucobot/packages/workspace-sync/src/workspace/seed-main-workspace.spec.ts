import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';

import {
  hasWorkspaceBootstrapFiles,
  repairOssProjectWorkspace,
  seedMainAgentWorkspace,
} from './seed-main-workspace.js';

describe('seed-main-workspace', () => {
  it('seeds bootstrap markdown when workspace is empty', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'aucobot-seed-'));
    try {
      const dataDir = path.join(root, 'default');
      await mkdir(path.join(dataDir, 'workspace'), { recursive: true });

      const seeded = await seedMainAgentWorkspace(dataDir);
      assert.equal(seeded, true);
      assert.equal(
        await hasWorkspaceBootstrapFiles(path.join(dataDir, 'workspace')),
        true,
      );
      const agents = await readFile(
        path.join(dataDir, 'workspace', 'AGENTS.md'),
        'utf8',
      );
      assert.match(agents, /helpful assistant/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('does not overwrite existing bootstrap files', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'aucobot-seed-'));
    try {
      const dataDir = path.join(root, 'default');
      const workspaceDir = path.join(dataDir, 'workspace');
      await mkdir(workspaceDir, { recursive: true });
      await writeFile(path.join(workspaceDir, 'AGENTS.md'), '# keep me', 'utf8');

      const seeded = await seedMainAgentWorkspace(dataDir);
      assert.equal(seeded, false);
      assert.equal(await readFile(path.join(workspaceDir, 'AGENTS.md'), 'utf8'), '# keep me');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('repair clears stale attestations when workspace is empty', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'aucobot-repair-'));
    try {
      const dataDir = path.join(root, 'default');
      const workspaceDir = path.join(dataDir, 'workspace');
      const attestationDir = path.join(dataDir, 'workspace-attestations');
      await mkdir(workspaceDir, { recursive: true });
      await mkdir(attestationDir, { recursive: true });
      await writeFile(
        path.join(attestationDir, 'deadbeef.attested'),
        '{"ok":true}',
        'utf8',
      );

      const repaired = await repairOssProjectWorkspace(dataDir);
      assert.equal(repaired, true);
      assert.equal(
        await hasWorkspaceBootstrapFiles(workspaceDir),
        true,
      );
      let attestationEntries: string[] = [];
      try {
        attestationEntries = await readdir(attestationDir);
      } catch {
        attestationEntries = [];
      }
      assert.equal(attestationEntries.length, 0);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
