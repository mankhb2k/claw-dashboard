import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { IncomingMessage, ServerResponse } from 'node:http';

export async function handleMcpHttpRequest(
  req: IncomingMessage,
  res: ServerResponse,
  body: unknown,
  server: McpServer,
): Promise<void> {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.on('close', () => {
    void transport.close().catch(() => undefined);
    void server.close().catch(() => undefined);
  });

  if (!req.headers.accept) {
    req.headers.accept = 'application/json, text/event-stream';
  }

  await server.connect(transport);
  await transport.handleRequest(req, res, body);
}
