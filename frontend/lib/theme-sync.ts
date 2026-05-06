import { THEME_LS_STORAGE_KEY } from '@/lib/theme-constants'
import { themeModeSchema, type ThemeMode } from '@/schemas/theme.schema'
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
function readThemeFromLocalStorage(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  try {
    const raw = localStorage.getItem(THEME_LS_STORAGE_KEY)
    if (!raw) return 'light'
    const parsedJson: unknown = JSON.parse(raw)
    if (!parsedJson || typeof parsedJson !== 'object') return 'light'
    const state = (parsedJson as { state?: unknown }).state
    if (!state || typeof state !== 'object') return 'light'
    const t = (state as { theme?: unknown }).theme
    const parsed = themeModeSchema.safeParse(t)
    return parsed.success ? parsed.data : 'light'
  } catch {
    return 'light'
  }
}

/**
 * Snapshot theme cho `<Theme appearance>`: trước khi hydrate xong đọc LS (hết nháy F5);
 * sau hydrate dùng bộ nhớ store (toggle cập nhật ngay, không phụ thuộc một frame LS).
 */
export function readRadixAppearance(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  try {
    const p = themePersist()
    if (typeof p.hasHydrated !== 'function' || !p.hasHydrated()) {
      return readThemeFromLocalStorage()
    }
    const mem = themeModeSchema.safeParse(useThemeStore.getState().theme)
    return mem.success ? mem.data : readThemeFromLocalStorage()
  } catch {
    return readThemeFromLocalStorage()
  }
}

export function subscribeRadixAppearance(onChange: () => void): () => void {
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

  return () => {
    unsubStore()
    unsubFinish?.()
    window.removeEventListener('storage', onStorage)
  }
}
