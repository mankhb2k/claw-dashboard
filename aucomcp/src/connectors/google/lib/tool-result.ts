import type { ToolResult } from './types.js';

export function toMcpToolReturn(result: ToolResult) {
  if (result.isError) {
    throw new Error(result.content[0]?.text ?? 'Tool error');
  }
  return {
    content: result.content.map((c) => ({
      type: 'text' as const,
      text: c.text,
    })),
  };
}
