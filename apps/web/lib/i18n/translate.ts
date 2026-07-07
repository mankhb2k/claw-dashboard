import { getDictionary } from './dictionaries'
import { readLocale } from './locale-storage'
import { getNestedString, interpolate } from './nested-get'

/** Translate outside React (e.g. axios interceptors). Uses locale from localStorage. */
export function translate(
  path: string,
  vars?: Record<string, string>,
): string {
  const dict = getDictionary(readLocale())
  const raw = getNestedString(dict as unknown as Record<string, unknown>, path)
  const s = raw ?? path
  return interpolate(s, vars)
}
