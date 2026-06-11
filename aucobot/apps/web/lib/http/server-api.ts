import { cookies } from 'next/headers'
import { getServerApiBaseUrl } from '@/lib/http/api-base-url'

export function getApiBaseUrl(): string {
  return getServerApiBaseUrl()
}

/** Cookie header for server-side calls to the Nest backend (forwards oc_access / oc_refresh). */
export async function getServerCookieHeader(): Promise<string> {
  const jar = await cookies()
  return jar
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ')
}

function unwrapApiPayload<T>(json: unknown): T {
  if (json && typeof json === 'object' && 'success' in json) {
    const body = json as Record<string, unknown>
    if (body.success === true) {
      return body.data as T
    }
    const err = body.error
    if (err && typeof err === 'object' && 'message' in err) {
      throw new Error(String((err as { message?: string }).message ?? 'API error'))
    }
    throw new Error('API error')
  }
  return json as T
}

export async function serverGet<T>(path: string): Promise<T> {
  const cookie = await getServerCookieHeader()
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const errBody: unknown = await res.json()
      if (errBody && typeof errBody === 'object') {
        const o = errBody as Record<string, unknown>
        const nested = o.error as { message?: string } | undefined
        message = nested?.message ?? (typeof o.message === 'string' ? o.message : message)
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message)
  }

  const json: unknown = await res.json()
  return unwrapApiPayload<T>(json)
}
