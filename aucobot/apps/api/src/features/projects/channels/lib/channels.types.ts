export type ChannelDto = {
  id: string;
  projectId: string;
  channelId: string;
  channelName: string;
  channelKind: string;
  enabled: boolean;
  connectionStatus: string;
  config: unknown;
  lastTestedAt: string | null;
  lastError: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
  secrets: Array<{ key: string; updatedAt: string; masked: string }>;
  definition?: {
    description: string;
    kind: string;
    docsPath?: string;
  };
};
