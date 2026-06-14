export type ChannelMergeRow = {
  channelId: string;
  enabled: boolean;
  connectionStatus: string;
  /** Slice for `channels.<channelId>` when active; omit when not synced. */
  openClawSlice?: Record<string, unknown>;
  /** Bundled OpenClaw plugin — set `plugins.entries[pluginId].enabled`. */
  pluginId?: string;
};

/** Channel ids managed by AucoBot sync (preserves other keys in openclaw.json). */
const MANAGED_CHANNEL_IDS = new Set(['telegram', 'discord']);

function mergePluginEntry(
  config: Record<string, unknown>,
  pluginId: string,
  enabled: boolean,
): void {
  const plugins = (config.plugins as Record<string, unknown> | undefined) ?? {};
  const existingEntries =
    (plugins.entries as Record<string, { enabled?: boolean }> | undefined) ?? {};
  plugins.entries = {
    ...existingEntries,
    [pluginId]: { enabled },
  };
  config.plugins = plugins;
}

/** Merge enabled CONNECTED channels into `openclaw.json` `channels` (+ bundled plugin entries). */
export function mergeChannelsIntoConfig(
  config: Record<string, unknown>,
  rows: ChannelMergeRow[],
): Record<string, unknown> {
  const existingChannels = (config.channels as Record<string, unknown> | undefined) ?? {};
  const channels: Record<string, unknown> = {};

  for (const [id, entry] of Object.entries(existingChannels)) {
    if (!MANAGED_CHANNEL_IDS.has(id)) {
      channels[id] = entry;
    }
  }

  const active = rows.filter(
    (r) =>
      r.enabled &&
      String(r.connectionStatus).toUpperCase() === 'CONNECTED' &&
      r.openClawSlice &&
      Object.keys(r.openClawSlice).length > 0,
  );

  for (const row of active) {
    if (row.openClawSlice) {
      channels[row.channelId] = row.openClawSlice;
    }
  }

  if (Object.keys(channels).length > 0) {
    config.channels = channels;
  } else {
    delete config.channels;
  }

  const enabledPluginIds = new Set(
    active.map((r) => r.pluginId).filter((id): id is string => Boolean(id?.trim())),
  );

  for (const pluginId of enabledPluginIds) {
    mergePluginEntry(config, pluginId, true);
  }

  for (const row of rows) {
    if (!row.pluginId || enabledPluginIds.has(row.pluginId)) continue;
    const isActive = active.some((a) => a.channelId === row.channelId);
    if (!isActive) {
      mergePluginEntry(config, row.pluginId, false);
    }
  }

  return config;
}
