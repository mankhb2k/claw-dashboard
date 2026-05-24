export {
  DEFAULT_LOCALE,
  I18N_LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  type Locale,
} from './constants'
export type { AppDictionary } from './dictionaries'
export { getDictionary, vi, en } from './dictionaries'
export { I18nProvider, useI18n } from './I18nProvider'
export {
  getServerLocaleSnapshot,
  readLocale,
  subscribeLocale,
  writeLocale,
} from './locale-storage'
export { getNestedString, interpolate } from './nested-get'
