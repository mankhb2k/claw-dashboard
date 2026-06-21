/** Gateway sandbox staging cap — keep in sync with @aucobot/runtime-contracts */
import { translate } from '@/lib/i18n/translate';

export const SANDBOX_STAGING_MAX_BYTES = 5 * 1024 * 1024;

export function resolveEffectiveSandboxActive(input: {
  agentSlug: string;
  sandboxExempt?: boolean;
  sandboxApplied?: boolean;
  projectSandboxDefaultEnabled?: boolean;
  projectSandboxDefaultMode?: string;
}): boolean {
  if (!input.projectSandboxDefaultEnabled) return false;

  const mode =
    input.projectSandboxDefaultMode === 'selected' ||
    input.projectSandboxDefaultMode === 'non-main'
      ? 'selected'
      : 'all';

  if (mode === 'selected') {
    return input.sandboxApplied === true;
  }

  if (input.sandboxExempt === true) return false;
  return true;
}

export function isFileOverSandboxStagingLimit(
  sizeBytes: number,
  sandboxActive: boolean,
): boolean {
  return sandboxActive && sizeBytes > SANDBOX_STAGING_MAX_BYTES;
}

export function sandboxStagingLimitError(fileName: string): string {
  return translate('chat.composer.sandboxLimitError', { name: fileName })
}
