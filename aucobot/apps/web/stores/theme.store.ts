import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { THEME_LS_STORAGE_KEY } from '@/lib/theme/theme-constants'
import { syncAppearanceCookie } from '@/lib/theme/theme-cookie'
import { resolveThemeAppearance } from '@/lib/theme/theme-resolve'
import {
  themePreferenceSchema,
  type ThemePreference,
} from '@/schemas/theme.schema'

export const THEME_STORAGE_KEY = THEME_LS_STORAGE_KEY

interface ThemeState {
  theme: ThemePreference
  setTheme: (theme: ThemePreference) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => {
        const parsed = themePreferenceSchema.safeParse(theme)
        if (parsed.success) {
          const next = parsed.data
          set({ theme: next })
          syncAppearanceCookie(next)
        }
      },
      toggleTheme: () => {
        const next: ThemePreference =
          resolveThemeAppearance(get().theme) === 'dark' ? 'light' : 'dark'
        set({ theme: next })
        syncAppearanceCookie(next)
      },
    }),
    {
      name: THEME_LS_STORAGE_KEY,
      onRehydrateStorage: () => (state?: ThemeState, error?: unknown) => {
        if (error || typeof window === 'undefined' || !state) return
        const parsed = themePreferenceSchema.safeParse(state.theme)
        if (parsed.success) syncAppearanceCookie(parsed.data)
      },
    },
  ),
)
