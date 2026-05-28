import { z } from 'zod'

export const themePreferenceSchema = z.enum(['light', 'dark', 'system'])

export type ThemePreference = z.infer<typeof themePreferenceSchema>

export const themeAppearanceSchema = z.enum(['light', 'dark'])

export type ThemeAppearance = z.infer<typeof themeAppearanceSchema>

/** @deprecated Use themePreferenceSchema */
export const themeModeSchema = themePreferenceSchema

/** @deprecated Use ThemePreference */
export type ThemeMode = ThemePreference
