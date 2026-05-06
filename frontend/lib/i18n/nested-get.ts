/** Lấy chuỗi theo path dạng `channels.page.title` từ object lồng nhau. */
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

/** Thay `{{key}}` trong template bằng giá trị từ `vars`. */
export function interpolate(
  template: string,
  vars?: Record<string, string>,
): string {
  if (!vars) return template
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    return vars[key] ?? `{{${key}}}`
  })
}
