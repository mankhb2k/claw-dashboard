import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { GoogleOAuthSecrets } from '@aucobot/mcp-core';
import { registerConnectorTools } from '@aucobot/mcp-core';
import { createDriveToolContext } from './tool-context.js';
import { driveToolSchemas, handleTool, toolDefinitions } from './handlers.js';

const PACKAGE_VERSION = '0.1.0';

export function createGoogleDriveMcpServer(secrets: GoogleOAuthSecrets): McpServer {
  const server = new McpServer({
    name: 'aucobot-mcp-google-drive',
    version: PACKAGE_VERSION,
  });

  const toolCtx = createDriveToolContext(secrets);
  registerConnectorTools(server, toolDefinitions, driveToolSchemas, handleTool, toolCtx);

  return server;
}
