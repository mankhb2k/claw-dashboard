export type ConnectorContext = {
  projectId: string;
  connectorSlug: string;
  secrets: Record<string, string>;
  getAccessToken: () => Promise<string>;
};

export type ConnectorSlug = 'google-drive' | 'google-calendar';

export const SUPPORTED_CONNECTOR_SLUGS: ConnectorSlug[] = ['google-drive', 'google-calendar'];

export function isSupportedConnectorSlug(slug: string): slug is ConnectorSlug {
  return (SUPPORTED_CONNECTOR_SLUGS as string[]).includes(slug);
}
