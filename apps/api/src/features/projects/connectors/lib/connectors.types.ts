export type ProjectConnectorDto = {
  id: string;
  projectId: string;
  connectorDefinitionId: string;
  connectorSlug: string;
  connectorName: string;
  connectorKind: string;
  displayName: string;
  enabled: boolean;
  connectionStatus: string;
  config: unknown;
  lastTestedAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  secrets: Array<{ key: string; updatedAt: string; masked: string }>;
  definition?: {
    description: string;
    status: string;
    configSchema: null;
  };
};
