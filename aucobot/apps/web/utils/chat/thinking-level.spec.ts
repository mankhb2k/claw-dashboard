import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  DEFAULT_THINKING_LEVEL,
  normalizeThinkingLevel,
  resolveThinkingLevel,
  THINKING_LEVEL_OPTIONS,
} from './thinking-level.js';

describe('thinking-level', () => {
  it('exposes curated UI options', () => {
    assert.deepEqual(
      THINKING_LEVEL_OPTIONS.map((o) => o.value),
      ['off', 'low', 'medium', 'high', 'adaptive'],
    );
  });

  it('defaults to off', () => {
    assert.equal(DEFAULT_THINKING_LEVEL, 'off');
    assert.equal(resolveThinkingLevel(undefined), 'off');
    assert.equal(resolveThinkingLevel(''), 'off');
  });

  it('normalizes known levels', () => {
    assert.equal(normalizeThinkingLevel('HIGH'), 'high');
    assert.equal(normalizeThinkingLevel(' adaptive '), 'adaptive');
  });

  it('rejects unknown levels', () => {
    assert.equal(normalizeThinkingLevel('max'), null);
    assert.equal(normalizeThinkingLevel('xhigh'), null);
  });
});
