import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';

import {
  OSS_FIXED_PROJECT_DISK_DIR,
  resolveProjectDataDir,
  resolveProjectDiskDirName,
} from './project-paths.js';

describe('project-paths', () => {
  const originalRuntimeMode = process.env.RUNTIME_MODE;
  let dataRoot = '';

  beforeEach(async () => {
    delete process.env.RUNTIME_MODE;
    dataRoot = await mkdtemp(join(tmpdir(), 'project-paths-'));
  });

  afterEach(() => {
    if (originalRuntimeMode === undefined) {
      delete process.env.RUNTIME_MODE;
    } else {
      process.env.RUNTIME_MODE = originalRuntimeMode;
    }
  });

  it('maps cloud/dev project id to folder name', () => {
    assert.equal(
      resolveProjectDataDir('cmqabc123', { dataRoot }),
      join(dataRoot, 'cmqabc123'),
    );
  });

  it('maps OSS runtime to default folder', () => {
    process.env.RUNTIME_MODE = 'oss';
    assert.equal(resolveProjectDiskDirName('cmqabc123'), OSS_FIXED_PROJECT_DISK_DIR);
    assert.equal(
      resolveProjectDataDir('cmqabc123', { dataRoot }),
      join(dataRoot, 'default'),
    );
  });

  it('honors diskDirName override over RUNTIME_MODE', () => {
    process.env.RUNTIME_MODE = 'oss';
    assert.equal(
      resolveProjectDataDir('cmqabc123', {
        dataRoot,
        diskDirName: 'pinned',
      }),
      join(dataRoot, 'pinned'),
    );
  });
});
