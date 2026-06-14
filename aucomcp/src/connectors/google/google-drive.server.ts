import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ConnectorContext } from '../types.js';
import { createToolContext } from './lib/tool-context.js';
import { registerConnectorTools } from './lib/register-tools.js';
import { driveToolSchemas, handleTool, toolDefinitions } from './drive/handlers.js';

export function createGoogleDriveMcpServer(connectorCtx: ConnectorContext): McpServer {
  const server = new McpServer({
    name: 'aucomcp-google-drive',
    version: '0.2.0',
  });

  const toolCtx = createToolContext(connectorCtx);
  registerConnectorTools(server, toolDefinitions, driveToolSchemas, handleTool, toolCtx);

  return server;
}
