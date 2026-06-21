import {
  DEFAULT_LOCALE,
  I18N_LOCALE_STORAGE_KEY,
  type Locale,
  SUPPORTED_LOCALES,
} from './constants'

const LOCALE_EVENT = 'openclaw-locale-change'

function isLocale(s: string | null): s is Locale {
  return s !== null && (SUPPORTED_LOCALES as readonly string[]).includes(s)
}

export function readLocale(): Locale {
  return readLocaleWithFallback(DEFAULT_LOCALE)
}

export function readLocaleWithFallback(fallback: Locale): Locale {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage?.getItem(I18N_LOCALE_STORAGE_KEY) ?? null
    return isLocale(raw) ? raw : fallback
  } catch {
    return fallback
  }
}

export function writeLocale(locale: Locale) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(I18N_LOCALE_STORAGE_KEY, locale)
  window.dispatchEvent(new Event(LOCALE_EVENT))
}

export function subscribeLocale(callback: () => void) {
  if (typeof window === 'undefined') return () => {}
  const onStore = (e: StorageEvent) => {
    if (e.key === I18N_LOCALE_STORAGE_KEY || e.key === null) callback()
  }
  const onLocal = () => callback()
  window.addEventListener('storage', onStore)
  window.addEventListener(LOCALE_EVENT, onLocal)
  return () => {
    window.removeEventListener('storage', onStore)
    window.removeEventListener(LOCALE_EVENT, onLocal)
  }
}

export function getServerLocaleSnapshot(): Locale {
  return DEFAULT_LOCALE
}
