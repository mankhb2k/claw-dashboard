/** Gateway sandbox staging cap — keep in sync with @aucobot/runtime-contracts */
export const SANDBOX_STAGING_MAX_BYTES = 5 * 1024 * 1024;

export function resolveEffectiveSandboxActive(input: {
  agentSlug: string;
  agentSandboxEnabled?: boolean;
  projectSandboxDefaultEnabled?: boolean;
  projectSandboxDefaultMode?: string;
}): boolean {
  if (input.agentSandboxEnabled) return true;
  if (!input.projectSandboxDefaultEnabled) return false;
  if (input.projectSandboxDefaultMode === 'all') return true;
  return input.agentSlug !== 'main';
}

export function isFileOverSandboxStagingLimit(
  sizeBytes: number,
  sandboxActive: boolean,
): boolean {
  return sandboxActive && sizeBytes > SANDBOX_STAGING_MAX_BYTES;
}

export function sandboxStagingLimitError(fileName: string): string {
  return `"${fileName}" vượt 5 MB (giới hạn sandbox). Gỡ sandbox hoặc dùng file nhỏ hơn.`;
}
