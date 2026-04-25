export interface ToolConfig {
  timeout: number;      // ms — BullMQ job timeout
  estimatedWait: string;
  mockDelayMs: number;  // dev mock worker simulation delay
}

// Adding a new tool = add one entry here. No other files need changing.
export const TOOL_REGISTRY: Record<string, ToolConfig> = {
  FFMPEG:     { timeout: 300000, estimatedWait: '2-5 minutes',   mockDelayMs: 3000 },
  PLAYWRIGHT: { timeout: 120000, estimatedWait: '30-60 seconds', mockDelayMs: 1500 },
  TTS:        { timeout: 120000, estimatedWait: '10-30 seconds', mockDelayMs: 1000 },
  STT:        { timeout: 300000, estimatedWait: '1-2 minutes',   mockDelayMs: 2000 },
};

export type SupportedTool = keyof typeof TOOL_REGISTRY;

export function getToolConfig(tool: string): ToolConfig {
  const config = TOOL_REGISTRY[tool.toUpperCase()];
  if (!config) throw new Error(`Unknown tool: ${tool}`);
  return config;
}
