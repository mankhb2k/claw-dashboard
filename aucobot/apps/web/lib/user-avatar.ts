import { getPublicApiBaseUrl } from '@/lib/api-base-url'

/** Build absolute avatar src from API path or CDN URL on PublicUser.avatarUrl. */
export function resolveUserAvatarSrc(
  avatarUrl: string | null | undefined,
): string | undefined {
  if (!avatarUrl?.trim()) {
    return undefined
  }
  const value = avatarUrl.trim()
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }
  const base = getPublicApiBaseUrl()
  const path = value.startsWith('/') ? value : `/${value}`
  return base ? `${base}${path}` : path
}
