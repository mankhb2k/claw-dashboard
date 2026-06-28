#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadGoogleSecretsFromEnv } from '@aucobot/mcp-core';
import { createGoogleDriveMcpServer } from './server.js';

async function main(): Promise<void> {
  const secrets = await loadGoogleSecretsFromEnv();
  const server = createGoogleDriveMcpServer(secrets);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('[aucobot-mcp-google-drive] failed to start', err);
  process.exit(1);
});
