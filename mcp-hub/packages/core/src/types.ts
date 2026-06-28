export interface ToolResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export function errorResponse(message: string): ToolResult {
  return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
}

export type GoogleOAuthSecrets = {
  client_id: string;
  client_secret: string;
  refresh_token: string;
};
