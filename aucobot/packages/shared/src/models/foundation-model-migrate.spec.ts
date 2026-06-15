import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { migrateFoundationOpenClawId } from './foundation-model-migrate.js';

describe('foundation-model-migrate', () => {
  it('migrates deprecated DeepSeek ids', () => {
    assert.equal(
      migrateFoundationOpenClawId('deepseek/deepseek-v3'),
      'deepseek/deepseek-v4-flash',
    );
    assert.equal(
      migrateFoundationOpenClawId('deepseek/deepseek-r1'),
      'deepseek/deepseek-v4-pro',
    );
  });

  it('passes through current ids', () => {
    assert.equal(
      migrateFoundationOpenClawId('deepseek/deepseek-v4-flash'),
      'deepseek/deepseek-v4-flash',
    );
  });

  it('returns null for empty input', () => {
    assert.equal(migrateFoundationOpenClawId(null), null);
    assert.equal(migrateFoundationOpenClawId('  '), null);
  });
});
