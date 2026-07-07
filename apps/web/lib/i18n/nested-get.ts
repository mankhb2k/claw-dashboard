/** Look up a string by dot path such as `channels.page.title` from a nested object. */
export function getNestedString(
  obj: Record<string, unknown>,
  path: string,
): string | undefined {
  const keys = path.split('.')
  let cur: unknown = obj
  for (const k of keys) {
    if (cur === null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[k]
  }
  return typeof cur === 'string' ? cur : undefined
}

/** Replace `{{key}}` placeholders in a template with values from `vars`. */
export function interpolate(
  template: string,
  vars?: Record<string, string>,
): string {
  if (!vars) return template
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    return vars[key] ?? `{{${key}}}`
  })
}
