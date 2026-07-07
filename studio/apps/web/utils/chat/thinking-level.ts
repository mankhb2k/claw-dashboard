export const THINKING_LEVELS = [
  'off',
  'low',
  'medium',
  'high',
  'adaptive',
] as const;

export type ThinkingLevel = (typeof THINKING_LEVELS)[number];

export const DEFAULT_THINKING_LEVEL: ThinkingLevel = 'off';

export const THINKING_LEVEL_OPTIONS: ReadonlyArray<{
  value: ThinkingLevel;
  label: string;
}> = [
  { value: 'off', label: 'Off (fast)' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'adaptive', label: 'Adaptive' },
];

const THINKING_LEVEL_SET = new Set<string>(THINKING_LEVELS);

export function normalizeThinkingLevel(
  raw: string | null | undefined,
): ThinkingLevel | null {
  const trimmed = raw?.trim().toLowerCase();
  if (!trimmed || !THINKING_LEVEL_SET.has(trimmed)) return null;
  return trimmed as ThinkingLevel;
}

export function resolveThinkingLevel(
  raw: string | null | undefined,
): ThinkingLevel {
  return normalizeThinkingLevel(raw) ?? DEFAULT_THINKING_LEVEL;
}
