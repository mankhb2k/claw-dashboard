import type { ThemeMode } from '@/schemas/theme.schema'
import { THEME_APPEARANCE_COOKIE, THEME_COOKIE_MAX_AGE } from '@/lib/theme-constants'

export function syncAppearanceCookie(theme: ThemeMode): void {
  if (typeof document === 'undefined') return
  const v = theme === 'dark' ? 'dark' : 'light'
  document.cookie = `${THEME_APPEARANCE_COOKIE}=${v};path=/;max-age=${THEME_COOKIE_MAX_AGE};SameSite=Lax`
}
