import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import {
  loadSessionThinkingSelection,
  resolveSessionThinkingLevel,
  saveSessionThinkingSelection,
} from './thinking-storage.js';

describe('session-thinking-storage', () => {
  const projectId = 'proj-1';
  const agentId = 'main';
  const sessionKey = 'agent:main:main';
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: globalThis,
    });
    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
        removeItem: (key: string) => {
          store.delete(key);
        },
        clear: () => {
          store.clear();
        },
      },
    });
  });

  it('prefers gateway thinking level over storage', () => {
    saveSessionThinkingSelection(projectId, agentId, sessionKey, 'low');
    assert.equal(
      resolveSessionThinkingLevel(projectId, agentId, sessionKey, 'high'),
      'high',
    );
  });

  it('falls back to storage then off', () => {
    saveSessionThinkingSelection(projectId, agentId, sessionKey, 'medium');
    assert.equal(
      resolveSessionThinkingLevel(projectId, agentId, sessionKey),
      'medium',
    );
    assert.equal(
      loadSessionThinkingSelection(projectId, agentId, sessionKey),
      'medium',
    );
    assert.equal(
      resolveSessionThinkingLevel(projectId, agentId, 'agent:main:other'),
      'off',
    );
  });
});
