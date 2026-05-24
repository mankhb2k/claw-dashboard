import type { Locale } from '../constants'
import { DEFAULT_LOCALE } from '../constants'
import { en } from './en'
import type { ViDictionary } from './vi'
import { vi } from './vi'

/** Cấu trúc chuỗi theo `vi.ts`; `en.ts` phải giữ cùng keys (nội dung khác ngôn ngữ). */
export type AppDictionary = ViDictionary

const MAP: Record<Locale, AppDictionary> = {
  vi,
  en: en as unknown as AppDictionary,
}

export function getDictionary(locale: Locale): AppDictionary {
  return MAP[locale] ?? MAP[DEFAULT_LOCALE]
}

export { en, vi }
