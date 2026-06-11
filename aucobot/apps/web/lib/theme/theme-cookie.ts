import type { ThemePreference } from '@/schemas/theme.schema'
import { THEME_APPEARANCE_COOKIE, THEME_COOKIE_MAX_AGE } from '@/lib/theme/theme-constants'
import { resolveThemeAppearance } from '@/lib/theme/theme-resolve'

export function syncAppearanceCookie(preference: ThemePreference): void {
  if (typeof document === 'undefined') return
  const v = resolveThemeAppearance(preference) === 'dark' ? 'dark' : 'light'
  document.cookie = `${THEME_APPEARANCE_COOKIE}=${v};path=/;max-age=${THEME_COOKIE_MAX_AGE};SameSite=Lax`
}
