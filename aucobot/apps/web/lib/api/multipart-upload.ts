import { getPublicApiBaseUrl } from '@/lib/api-base-url'

type ApiEnvelope<T> = {
  success?: boolean
  data?: T
  error?: { message?: string }
}

function parseApiEnvelope<T>(json: unknown): T {
  if (json && typeof json === 'object' && 'success' in json) {
    const envelope = json as ApiEnvelope<T>
    if (envelope.success === false) {
      throw new Error(envelope.error?.message ?? 'Request failed')
    }
    return envelope.data as T
  }
  return json as T
}

/** Multipart upload — fetch avoids axios forcing application/json on FormData. */
export async function uploadMultipart(
  path: string,
  form: FormData,
  method: 'POST' | 'PUT' = 'POST',
): Promise<unknown> {
  const base = getPublicApiBaseUrl()
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`
  const res = await fetch(url, {
    method,
    body: form,
    credentials: 'include',
  })

  const json: unknown = await res.json().catch(() => null)

  if (!res.ok) {
    const message =
      (json &&
        typeof json === 'object' &&
        'error' in json &&
        (json as ApiEnvelope<unknown>).error?.message) ||
      (json &&
        typeof json === 'object' &&
        'message' in json &&
        String((json as { message: unknown }).message)) ||
      `Upload failed (${res.status})`
    throw new Error(String(message))
  }

  return parseApiEnvelope(json)
}
