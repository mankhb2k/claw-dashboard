import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { THEME_LS_STORAGE_KEY } from '@/lib/theme-constants'
import { syncAppearanceCookie } from '@/lib/theme-cookie'
import { themeModeSchema, type ThemeMode } from '@/schemas/theme.schema'

export const THEME_STORAGE_KEY = THEME_LS_STORAGE_KEY

interface ThemeState {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => {
        const parsed = themeModeSchema.safeParse(theme)
        if (parsed.success) {
          const next = parsed.data
          set({ theme: next })
          syncAppearanceCookie(next)
        }
      },
      toggleTheme: () => {
        const next: ThemeMode = get().theme === 'dark' ? 'light' : 'dark'
        set({ theme: next })
        syncAppearanceCookie(next)
      },
    }),
    {
      name: THEME_LS_STORAGE_KEY,
      onRehydrateStorage: () => (state?: ThemeState, error?: unknown) => {
        if (error || typeof window === 'undefined' || !state) return
        const parsed = themeModeSchema.safeParse(state.theme)
        if (parsed.success) syncAppearanceCookie(parsed.data)
      },
    },
  ),
)
