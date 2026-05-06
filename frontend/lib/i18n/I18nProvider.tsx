'use client'

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
} from 'react'
import { DEFAULT_LOCALE, type Locale } from './constants'
import { getDictionary, type AppDictionary } from './dictionaries'
import { getNestedString, interpolate } from './nested-get'
import {
  getServerLocaleSnapshot,
  readLocale,
  subscribeLocale,
  writeLocale,
} from './locale-storage'
import { resolveOpenClawChannels, type OpenClawChannel } from '@/lib/openclaw-channels'

type I18nContextValue = {
  locale: Locale
  setLocale: (next: Locale) => void
  dict: AppDictionary
  t: (path: string, vars?: Record<string, string>) => string
  channels: OpenClawChannel[]
}

const I18nContext = createContext<I18nContextValue | null>(null)

function useLocaleFromStore(): Locale {
  return useSyncExternalStore(
    subscribeLocale,
    readLocale,
    getServerLocaleSnapshot,
  )
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocaleFromStore()
  const dict = useMemo(() => getDictionary(locale), [locale])

  const setLocale = useCallback((next: Locale) => {
    writeLocale(next)
  }, [])

  const t = useCallback(
    (path: string, vars?: Record<string, string>) => {
      const raw = getNestedString(dict as unknown as Record<string, unknown>, path)
      const s = raw ?? path
      return interpolate(s, vars)
    },
    [dict],
  )

  const channels = useMemo(
    () => resolveOpenClawChannels(dict.channels.items),
    [dict],
  )

  useLayoutEffect(() => {
    if (typeof document === 'undefined') return
    const lang = locale === DEFAULT_LOCALE ? 'vi' : locale
    document.documentElement.lang = lang
  }, [locale])

  const value = useMemo(
    () => ({ locale, setLocale, dict, t, channels }),
    [locale, setLocale, dict, t, channels],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return ctx
}
