import assert from 'node:assert/strict';
import { access, mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { migrateOssProjectDiskLayout } from './migrate-oss-disk-layout.js';
import { OSS_FIXED_PROJECT_DISK_DIR } from './project-paths.js';

async function writeOpenClawConfig(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'openclaw.json'), '{}\n', 'utf8');
}

describe('migrateOssProjectDiskLayout', () => {
  const originalRuntimeMode = process.env.RUNTIME_MODE;
  let dataRoot = '';

  beforeEach(async () => {
    process.env.RUNTIME_MODE = 'oss';
    dataRoot = await mkdtemp(join(tmpdir(), 'oss-disk-migrate-'));
  });

  afterEach(async () => {
    if (originalRuntimeMode === undefined) {
      delete process.env.RUNTIME_MODE;
    } else {
      process.env.RUNTIME_MODE = originalRuntimeMode;
    }
  });

  it('no-ops outside OSS runtime', async () => {
    process.env.RUNTIME_MODE = 'cloud';
    const result = await migrateOssProjectDiskLayout({ dataRoot });
    assert.equal(result.action, 'none');
    assert.equal(result.migrated, false);
  });

  it('no-ops on fresh install with no legacy folders', async () => {
    const result = await migrateOssProjectDiskLayout({ dataRoot });
    assert.equal(result.action, 'none');
    assert.equal(result.migrated, false);
  });

  it('renames a single legacy folder to default', async () => {
    const legacy = join(dataRoot, 'cmqlegacy01');
    await writeOpenClawConfig(legacy);

    const result = await migrateOssProjectDiskLayout({ dataRoot });
    assert.equal(result.migrated, true);
    assert.equal(result.action, 'renamed');
    assert.equal(result.sourceDir, 'cmqlegacy01');

    await access(join(dataRoot, OSS_FIXED_PROJECT_DISK_DIR, 'openclaw.json'));
  });

  it('picks folder with pending pairing and archives the rest', async () => {
    const stale = join(dataRoot, 'cmqstale01');
    const active = join(dataRoot, 'cmqactive02');
    await writeOpenClawConfig(stale);
    await writeOpenClawConfig(active);
    await mkdir(join(active, 'devices'), { recursive: true });
    await writeFile(join(active, 'devices', 'pending.json'), '{}\n', 'utf8');

    const result = await migrateOssProjectDiskLayout({ dataRoot });
    assert.equal(result.migrated, true);
    assert.equal(result.sourceDir, 'cmqactive02');
    assert.deepEqual(result.archivedDirs, ['cmqstale01']);

    await access(join(dataRoot, OSS_FIXED_PROJECT_DISK_DIR, 'openclaw.json'));
    await access(join(dataRoot, '_legacy', 'cmqstale01', 'openclaw.json'));
  });

  it('archives extra legacy folders when default already exists', async () => {
    await writeOpenClawConfig(join(dataRoot, OSS_FIXED_PROJECT_DISK_DIR));
    await writeOpenClawConfig(join(dataRoot, 'cmqold01'));

    const result = await migrateOssProjectDiskLayout({ dataRoot });
    assert.equal(result.action, 'already_default');
    assert.equal(result.migrated, true);
    assert.deepEqual(result.archivedDirs, ['cmqold01']);
    await access(join(dataRoot, '_legacy', 'cmqold01', 'openclaw.json'));
  });
});
