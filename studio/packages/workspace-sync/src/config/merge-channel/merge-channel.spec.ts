import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ChannelMergeRow } from './merge-channel.js';
import { mergeChannelsIntoConfig } from './merge-channel.js';

function telegramRow(overrides: Partial<ChannelMergeRow> = {}): ChannelMergeRow {
  return {
    channelId: 'telegram',
    enabled: true,
    connectionStatus: 'CONNECTED',
    openClawSlice: { botToken: 'token-123' },
    pluginId: 'telegram',
    ...overrides,
  };
}

describe('mergeChannelsIntoConfig', () => {
  it('preserves unmanaged channels while replacing managed ones', () => {
    const config: Record<string, unknown> = {
      channels: {
        slack: { webhook: 'keep-me' },
        telegram: { botToken: 'old' },
      },
    };

    const result = mergeChannelsIntoConfig(config, [
      telegramRow({ openClawSlice: { botToken: 'new-token' } }),
    ]);

    const channels = result.channels as Record<string, unknown>;
    assert.deepEqual(channels.slack, { webhook: 'keep-me' });
    assert.deepEqual(channels.telegram, { botToken: 'new-token' });
  });

  it('skips rows that are disabled, not CONNECTED, or missing openClawSlice', () => {
    const config: Record<string, unknown> = {
      channels: { telegram: { botToken: 'old' } },
    };

    const result = mergeChannelsIntoConfig(config, [
      telegramRow({ enabled: false }),
      telegramRow({ connectionStatus: 'DISCONNECTED' }),
      telegramRow({ openClawSlice: {} }),
      telegramRow({ openClawSlice: undefined }),
    ]);

    assert.equal(result.channels, undefined);
  });

  it('enables bundled plugin entries for active channels', () => {
    const config: Record<string, unknown> = {
      plugins: {
        entries: {
          discord: { enabled: false },
        },
      },
    };

    const result = mergeChannelsIntoConfig(config, [telegramRow()]);

    const entries = (result.plugins as { entries: Record<string, { enabled: boolean }> }).entries;
    assert.equal(entries.telegram.enabled, true);
    assert.equal(entries.discord.enabled, false);
  });

  it('disables plugin entries for inactive channels with pluginId', () => {
    const config: Record<string, unknown> = {
      plugins: {
        entries: {
          telegram: { enabled: true },
        },
      },
    };

    const result = mergeChannelsIntoConfig(config, [
      telegramRow({ enabled: false, connectionStatus: 'DISCONNECTED' }),
    ]);

    const entries = (result.plugins as { entries: Record<string, { enabled: boolean }> }).entries;
    assert.equal(entries.telegram.enabled, false);
  });

  it('deletes channels key when no entries remain', () => {
    const config: Record<string, unknown> = {
      channels: {
        telegram: { botToken: 'old' },
        discord: { token: 'old' },
      },
    };

    const result = mergeChannelsIntoConfig(config, []);

    assert.equal(result.channels, undefined);
  });
});
