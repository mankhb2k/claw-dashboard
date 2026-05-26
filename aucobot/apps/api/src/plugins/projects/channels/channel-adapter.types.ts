import type { ChannelKind, ChannelTestResult } from '@aucobot/shared';

/** Server-side channel plugin contract (registry adapters). Not the REST catalog DTO. */
export type ChannelAdapter = {
  id: string;
  displayName: string;
  description: string;
  kind: ChannelKind;
  status: 'ACTIVE' | 'DISABLED';
  secretKeys: string[];
  docsPath?: string;
  /** Bundled OpenClaw plugin id — enables `plugins.entries[id]` when channel is active. */
  pluginId?: string;
  testConnection(
    secrets: Record<string, string>,
    config: Record<string, unknown>,
  ): Promise<ChannelTestResult>;
  buildOpenClawConfig(
    secrets: Record<string, string>,
    config: Record<string, unknown>,
  ): Record<string, unknown>;
  defaultConfig(): Record<string, unknown>;
  normalizeConfig(existing: unknown, patch: Record<string, unknown>): Record<string, unknown>;
};
