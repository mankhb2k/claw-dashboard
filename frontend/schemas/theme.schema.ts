import { z } from 'zod'

export const themeModeSchema = z.enum(['light', 'dark'])

export type ThemeMode = z.infer<typeof themeModeSchema>
