import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { z } from 'zod';
import { toMcpToolReturn } from './tool-result.js';
import type { ToolDefinition, ToolResult } from './types.js';

export type ToolHandler<TCtx> = (
  toolName: string,
  args: Record<string, unknown>,
  ctx: TCtx,
) => Promise<ToolResult | null>;

export function registerConnectorTools<TCtx>(
  server: McpServer,
  definitions: ToolDefinition[],
  schemas: Record<string, z.ZodTypeAny>,
  handler: ToolHandler<TCtx>,
  ctx: TCtx,
): void {
  for (const def of definitions) {
    const schema = schemas[def.name];
    if (!schema) {
      throw new Error(`Missing Zod schema for tool: ${def.name}`);
    }

    const zodObject =
      'shape' in schema && typeof schema.shape === 'object' ?
        (schema as z.ZodObject<z.ZodRawShape>).shape
      : schema;

    server.registerTool(
      def.name,
      {
        description: def.description,
        inputSchema: zodObject as z.ZodRawShape,
      },
      async (args) => {
        const result = await handler(def.name, args as Record<string, unknown>, ctx);
        if (!result) {
          throw new Error(`Unknown tool: ${def.name}`);
        }
        return toMcpToolReturn(result);
      },
    );
  }
}
