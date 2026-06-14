import express, { type Express } from 'express';
import { pathToFileURL } from 'node:url';
import type { Request, Response } from 'express';
import type { AppConfig } from './config.js';
import { loadConfig } from './config.js';
import { extractBearerToken, verifyProjectMcpToken } from './auth/verify-project-token.js';
import { AucobotInternalClient } from './clients/aucobot-internal.client.js';
import { isSupportedConnectorSlug } from './connectors/types.js';
import { buildConnectorContext, createConnectorMcpServer } from './mcp/registry.js';
import { handleMcpHttpRequest } from './mcp/transport.js';

export function buildApp(config: AppConfig): Express {
  const app = express();
  const internalClient = new AucobotInternalClient(config);

  app.get('/healthz', (_req, res) => {
    res.json({ ok: true, service: 'aucomcp' });
  });

  app.get('/readyz', async (_req, res) => {
    const apiOk = await internalClient.ping();
    if (!apiOk) {
      res.status(503).json({ ok: false, api: false });
      return;
    }
    res.json({ ok: true, api: true });
  });

  app.get('/connectors/:slug/mcp', (_req, res) => {
    res.status(405).json({ error: 'Method not allowed — use POST' });
  });

  app.post(
    '/connectors/:slug/mcp',
    express.json({ limit: '2mb' }),
    async (req: Request<{ slug: string }>, res: Response) => {
      const slug = req.params.slug.trim().toLowerCase();
      if (!isSupportedConnectorSlug(slug)) {
        res.status(404).json({ error: `Unknown connector: ${slug}` });
        return;
      }

      const token = extractBearerToken(req.headers.authorization);
      if (!token) {
        res.status(401).json({ error: 'Missing Authorization Bearer token' });
        return;
      }

      const payload = verifyProjectMcpToken(token, config.MCP_SERVICE_SECRET);
      if (!payload) {
        res.status(401).json({ error: 'Invalid MCP project token' });
        return;
      }

      if (payload.connectorSlug !== slug) {
        res.status(403).json({ error: 'Token connector mismatch' });
        return;
      }

      let secrets: Record<string, string>;
      try {
        secrets = await internalClient.fetchConnectorSecrets(payload.projectId, slug);
      } catch (err) {
        console.error('Failed to fetch connector secrets', {
          err,
          projectId: payload.projectId,
          slug,
        });
        res.status(502).json({ error: 'Failed to load connector credentials' });
        return;
      }

      const ctx = buildConnectorContext({
        projectId: payload.projectId,
        connectorSlug: slug,
        secrets,
      });

      const mcpServer = createConnectorMcpServer(slug, ctx);

      try {
        await handleMcpHttpRequest(req, res, req.body, mcpServer);
      } catch (err) {
        console.error('MCP request failed', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'MCP handler error' });
        }
      }
    },
  );

  return app;
}

export function startServer(config: AppConfig): Promise<Express> {
  const app = buildApp(config);
  return new Promise((resolve) => {
    const server = app.listen(config.PORT, config.HOST, () => {
      console.log(`aucomcp listening on http://${config.HOST}:${config.PORT}`);
      resolve(app);
    });
    server.on('error', (err) => {
      console.error('aucomcp failed to start', err);
      process.exit(1);
    });
  });
}

const isDirectRun =
  typeof process.argv[1] === 'string' &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const config = loadConfig();
  void startServer(config);
}
