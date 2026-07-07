import type { ThemeAppearance, ThemePreference } from '@/schemas/theme.schema'

export function resolveThemeAppearance(
  preference: ThemePreference,
): ThemeAppearance {
  if (preference === 'system') {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }
  return preference
}
