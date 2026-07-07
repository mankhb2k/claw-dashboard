import { access, mkdir, readdir, rename, stat } from 'node:fs/promises';
import path from 'node:path';

import {
  OSS_FIXED_PROJECT_DISK_DIR,
  openClawConfigPath,
  resolveProjectsDataRoot,
  type ProjectLayoutOptions,
} from './project-paths.js';

const LEGACY_ARCHIVE_DIR = '_legacy';
const SKIP_DIR_NAMES = new Set([OSS_FIXED_PROJECT_DISK_DIR, LEGACY_ARCHIVE_DIR]);

export type OssDiskMigrationResult = {
  migrated: boolean;
  action: 'renamed' | 'already_default' | 'none';
  sourceDir?: string;
  archivedDirs?: string[];
};

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function hasOpenClawConfig(dir: string): Promise<boolean> {
  return pathExists(openClawConfigPath(dir));
}

async function isProjectDir(root: string, entry: string): Promise<boolean> {
  if (entry.startsWith('.') || SKIP_DIR_NAMES.has(entry)) return false;
  const full = path.join(root, entry);
  try {
    const st = await stat(full);
    if (!st.isDirectory()) return false;
  } catch {
    return false;
  }
  return hasOpenClawConfig(full);
}

async function pairingScore(dir: string): Promise<number> {
  let score = 0;
  if (await pathExists(path.join(dir, 'devices', 'pending.json'))) score += 2;
  if (await pathExists(path.join(dir, 'devices', 'paired.json'))) score += 1;
  try {
    const configStat = await stat(openClawConfigPath(dir));
    score += configStat.mtimeMs / 1e15;
  } catch {
    /* ignore */
  }
  return score;
}

async function listLegacyProjectDirs(root: string): Promise<string[]> {
  let entries: string[];
  try {
    entries = await readdir(root);
  } catch {
    return [];
  }
  const legacyDirs: string[] = [];
  for (const entry of entries) {
    if (await isProjectDir(root, entry)) {
      legacyDirs.push(entry);
    }
  }
  return legacyDirs;
}

async function archiveLegacyDirs(
  root: string,
  dirNames: string[],
): Promise<string[]> {
  const archivedDirs: string[] = [];
  if (dirNames.length === 0) return archivedDirs;
  const archiveRoot = path.join(root, LEGACY_ARCHIVE_DIR);
  await mkdir(archiveRoot, { recursive: true });
  for (const entry of dirNames) {
    const source = path.join(root, entry);
    const dest = path.join(archiveRoot, entry);
    try {
      await rename(source, dest);
      archivedDirs.push(entry);
    } catch {
      /* ignore races / partial migration */
    }
  }
  return archivedDirs;
}

async function pickBestLegacyDir(root: string, legacyDirs: string[]): Promise<string> {
  let best = legacyDirs[0]!;
  let bestScore = await pairingScore(path.join(root, best));
  for (const entry of legacyDirs.slice(1)) {
    const score = await pairingScore(path.join(root, entry));
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }
  return best;
}

/**
 * OSS upgrade: consolidate legacy `{dataRoot}/{cuid}/` folders into `{dataRoot}/default/`.
 * No-op when RUNTIME_MODE is not `oss` or when there is nothing to migrate.
 */
export async function migrateOssProjectDiskLayout(
  options?: ProjectLayoutOptions,
): Promise<OssDiskMigrationResult> {
  if (process.env.RUNTIME_MODE !== 'oss') {
    return { migrated: false, action: 'none' };
  }

  const root = resolveProjectsDataRoot(options);
  const defaultDir = path.join(root, OSS_FIXED_PROJECT_DISK_DIR);

  if (await hasOpenClawConfig(defaultDir)) {
    const legacyDirs = await listLegacyProjectDirs(root);
    const toArchive = legacyDirs.filter((name) => name !== OSS_FIXED_PROJECT_DISK_DIR);
    const archivedDirs = await archiveLegacyDirs(root, toArchive);
    return {
      migrated: archivedDirs.length > 0,
      action: 'already_default',
      archivedDirs,
    };
  }

  const legacyDirs = await listLegacyProjectDirs(root);
  if (legacyDirs.length === 0) {
    return { migrated: false, action: 'none' };
  }

  const best = await pickBestLegacyDir(root, legacyDirs);
  const sourceDir = path.join(root, best);
  await rename(sourceDir, defaultDir);

  const remaining = legacyDirs.filter((name) => name !== best);
  const archivedDirs = await archiveLegacyDirs(root, remaining);

  return {
    migrated: true,
    action: 'renamed',
    sourceDir: best,
    archivedDirs,
  };
}
