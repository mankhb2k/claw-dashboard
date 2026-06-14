import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ConnectorContext } from '../types.js';
import { createToolContext } from './lib/tool-context.js';
import { registerConnectorTools } from './lib/register-tools.js';
import { calendarToolSchemas, handleTool, toolDefinitions } from './calendar/handlers.js';

export function createGoogleCalendarMcpServer(connectorCtx: ConnectorContext): McpServer {
  const server = new McpServer({
    name: 'aucomcp-google-calendar',
    version: '0.2.0',
  });

  const toolCtx = createToolContext(connectorCtx);
  registerConnectorTools(server, toolDefinitions, calendarToolSchemas, handleTool, toolCtx);

  return server;
}
