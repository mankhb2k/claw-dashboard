export const I18N_LOCALE_STORAGE_KEY = 'openclaw.locale'

export const SUPPORTED_LOCALES = ['vi', 'en'] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'vi'
