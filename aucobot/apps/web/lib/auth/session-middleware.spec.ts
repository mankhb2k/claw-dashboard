import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import type { NextRequest } from 'next/server'

vi.mock('@/lib/http/api-base-url', () => ({
  getServerApiBaseUrl: () => 'http://localhost:3001',
}))

import { resolveSession } from '@/lib/auth/session-middleware'

function mockRequest(cookie?: string): NextRequest {
  return {
    headers: {
      get: (name: string) => (name === 'cookie' ? cookie ?? null : null),
    },
  } as NextRequest
}

describe('resolveSession', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('returns invalid when cookie header is empty', async () => {
    const result = await resolveSession(mockRequest())
    expect(result).toEqual({ valid: false, setCookies: [] })
  })

  it('returns valid and forwards Set-Cookie from backend', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { user: { id: 'u1' }, accessExpiresIn: 900 },
      }),
      headers: {
        getSetCookie: () => ['oc_access=new; Path=/; HttpOnly', 'oc_refresh=new; Path=/; HttpOnly'],
        get: () => null,
      },
    }) as unknown as typeof fetch

    const result = await resolveSession(mockRequest('oc_refresh=old'))

    expect(result.valid).toBe(true)
    expect(result.setCookies).toHaveLength(2)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/auth/session',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ cookie: 'oc_refresh=old' }),
      }),
    )
  })

  it('returns invalid on 401 from backend', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ success: false }),
      headers: {
        getSetCookie: () => [],
        get: () => null,
      },
    }) as unknown as typeof fetch

    const result = await resolveSession(mockRequest('oc_refresh=stale'))

    expect(result.valid).toBe(false)
    expect(result.setCookies).toEqual([])
  })
})
