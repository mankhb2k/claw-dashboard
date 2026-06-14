import type { calendar_v3, drive_v3 } from 'googleapis';

export interface ToolResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ToolContext {
  authClient: { credentials: Record<string, unknown>; request: (opts: Record<string, unknown>) => Promise<{ data: unknown }> };
  getDrive: () => drive_v3.Drive;
  getCalendar: () => calendar_v3.Calendar;
  log: (message: string, data?: unknown) => void;
  resolveFolderId: (input: string | undefined) => Promise<string>;
  checkFileExists: (name: string, parentFolderId?: string) => Promise<string | null>;
  validateTextFileExtension: (name: string) => void;
}

export function errorResponse(message: string): ToolResult {
  return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
}
