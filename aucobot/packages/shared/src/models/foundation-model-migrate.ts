/** Deprecated foundation OpenClaw model refs → current replacements. */
export const FOUNDATION_MODEL_MIGRATIONS: Readonly<Record<string, string>> = {
  'deepseek/deepseek-v3': 'deepseek/deepseek-v4-flash',
  'deepseek/deepseek-r1': 'deepseek/deepseek-v4-pro',
};

export function migrateFoundationOpenClawId(
  openclawId: string | null | undefined,
): string | null {
  const trimmed = openclawId?.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  for (const [from, to] of Object.entries(FOUNDATION_MODEL_MIGRATIONS)) {
    if (from.toLowerCase() === lower) {
      return to;
    }
  }
  return trimmed;
}
