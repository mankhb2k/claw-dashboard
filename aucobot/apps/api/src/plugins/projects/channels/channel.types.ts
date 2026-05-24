export type ChannelKind = 'BOT_TOKEN' | 'OAUTH' | 'WEBHOOK' | 'QR_PAIRING';

export type ChannelTestResult = {
  ok: boolean;
  message?: string;
  metadata?: Record<string, unknown>;
};

export type ChannelDefinition = {
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
};
