/** Khóa zustand persist trong localStorage (shape { state: { theme } }). */
export const THEME_LS_STORAGE_KEY = 'openclaw-theme'

/**
 * Cookie chỉ chứa `light` | `dark` để RootLayout SSR đọc — Radix `<Theme appearance>`
 * khớp ngay khi hydrate, tránh một khung hiển thị appearance="light".
 */
export const THEME_APPEARANCE_COOKIE = 'openclaw-appearance'

export const THEME_COOKIE_MAX_AGE = 31536000
