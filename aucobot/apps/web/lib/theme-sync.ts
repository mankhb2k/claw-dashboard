import { THEME_LS_STORAGE_KEY } from '@/lib/theme-constants'
import { resolveThemeAppearance } from '@/lib/theme-resolve'
import {
  themeAppearanceSchema,
  themePreferenceSchema,
  type ThemeAppearance,
  type ThemePreference,
} from '@/schemas/theme.schema'
import { useThemeStore } from '@/stores/theme.store'

type ThemePersistApi = {
  hasHydrated: () => boolean
  onFinishHydration: (callback: () => void) => () => void
  rehydrate: () => Promise<void>
}

/** API persist của zustand (middleware) — không nằm trong type mặc định của `create`. */
function themePersist(): ThemePersistApi {
  return (useThemeStore as unknown as { persist: ThemePersistApi }).persist
}

/** Chỉ đọc LS — khớp script `layout` + shape persist `{ state: { theme } }`. */
function readThemePreferenceFromLocalStorage(): ThemePreference {
  if (typeof window === 'undefined') return 'light'
  try {
    const raw = localStorage.getItem(THEME_LS_STORAGE_KEY)
    if (!raw) return 'light'
    const parsedJson: unknown = JSON.parse(raw)
    if (!parsedJson || typeof parsedJson !== 'object') return 'light'
    const state = (parsedJson as { state?: unknown }).state
    if (!state || typeof state !== 'object') return 'light'
    const t = (state as { theme?: unknown }).theme
    const parsed = themePreferenceSchema.safeParse(t)
    return parsed.success ? parsed.data : 'light'
  } catch {
    return 'light'
  }
}

function readThemePreference(): ThemePreference {
  if (typeof window === 'undefined') return 'light'
  try {
    const p = themePersist()
    if (typeof p.hasHydrated !== 'function' || !p.hasHydrated()) {
      return readThemePreferenceFromLocalStorage()
    }
    const mem = themePreferenceSchema.safeParse(useThemeStore.getState().theme)
    return mem.success ? mem.data : readThemePreferenceFromLocalStorage()
  } catch {
    return readThemePreferenceFromLocalStorage()
  }
}

/**
 * Snapshot theme: trước khi hydrate xong đọc LS (hết nháy F5);
 * sau hydrate dùng bộ nhớ store (toggle cập nhật ngay, không phụ thuộc một frame LS).
 */
export function readThemeAppearance(): ThemeAppearance {
  return resolveThemeAppearance(readThemePreference())
}

export function subscribeThemeAppearance(onChange: () => void): () => void {
  const unsubStore = useThemeStore.subscribe(onChange)

  let unsubFinish: (() => void) | undefined
  try {
    unsubFinish = themePersist().onFinishHydration(() => {
      onChange()
    })
  } catch {
    unsubFinish = undefined
  }

  const onStorage = (e: StorageEvent) => {
    if (e.key !== THEME_LS_STORAGE_KEY) return
    void themePersist()
      .rehydrate()
      .then(() => {
        onChange()
      })
  }
  window.addEventListener('storage', onStorage)

  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const onMq = () => {
    if (readThemePreference() === 'system') onChange()
  }
  mq.addEventListener('change', onMq)

  return () => {
    unsubStore()
    unsubFinish?.()
    window.removeEventListener('storage', onStorage)
    mq.removeEventListener('change', onMq)
  }
}

/** Dùng khi cần validate appearance (ví dụ editor). */
export function parseThemeAppearance(value: unknown): ThemeAppearance {
  const parsed = themeAppearanceSchema.safeParse(value)
  return parsed.success ? parsed.data : 'light'
}
