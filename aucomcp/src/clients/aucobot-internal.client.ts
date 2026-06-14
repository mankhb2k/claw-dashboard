import type { AppConfig } from '../config.js';

export type ConnectorSecrets = Record<string, string>;

export class AucobotInternalClient {
  constructor(private readonly config: AppConfig) {}

  async fetchConnectorSecrets(
    projectId: string,
    connectorSlug: string,
  ): Promise<ConnectorSecrets> {
    const base = this.config.AUCOBOT_INTERNAL_API_URL.replace(/\/$/, '');
    const url = `${base}/api/internal/mcp/projects/${encodeURIComponent(projectId)}/connectors/${encodeURIComponent(connectorSlug)}/secrets`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Mcp-Service-Secret': this.config.MCP_SERVICE_SECRET,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Internal API ${res.status}: ${text.slice(0, 200) || res.statusText}`);
    }

    const json = (await res.json()) as { secrets?: ConnectorSecrets };
    if (!json.secrets || typeof json.secrets !== 'object') {
      throw new Error('Internal API returned invalid secrets payload');
    }
    return json.secrets;
  }

  async ping(): Promise<boolean> {
    const base = this.config.AUCOBOT_INTERNAL_API_URL.replace(/\/$/, '');
    try {
      const res = await fetch(`${base}/api/health`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }
}
