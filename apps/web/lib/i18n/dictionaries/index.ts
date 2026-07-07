import { DEFAULT_LOCALE } from '../constants'
import { en } from './en'
import { vi } from './vi'

import type { ViDictionary } from './vi'
import type { Locale } from '../constants'

/** String structure follows `vi`; `en` must keep the same keys (different language content). */
export type AppDictionary = ViDictionary

const MAP: Record<Locale, AppDictionary> = {
  vi,
  en: en as unknown as AppDictionary,
}

export function getDictionary(locale: Locale): AppDictionary {
  return MAP[locale] ?? MAP[DEFAULT_LOCALE]
}

export { en, vi }
