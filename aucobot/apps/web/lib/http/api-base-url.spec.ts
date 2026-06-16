import { afterEach, describe, expect, it, vi } from 'vitest'

import { getPublicApiBaseUrl } from '@/lib/http/api-base-url'

function setWindowOrigin(origin: string): void {
  vi.stubGlobal('window', {
    location: { origin },
  })
}

describe('getPublicApiBaseUrl', () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL

  afterEach(() => {
    vi.unstubAllGlobals()
    if (originalApiUrl === undefined) {
      delete process.env.NEXT_PUBLIC_API_URL
      return
    }
    process.env.NEXT_PUBLIC_API_URL = originalApiUrl
  })

  it('returns empty when NEXT_PUBLIC_API_URL is not set', () => {
    delete process.env.NEXT_PUBLIC_API_URL
    expect(getPublicApiBaseUrl()).toBe('')
  })

  it('keeps configured same-origin localhost URL', () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8386/'
    setWindowOrigin('http://localhost:8386')

    expect(getPublicApiBaseUrl()).toBe('http://localhost:8386')
  })

  it('falls back to same-origin for localhost cross-port in browser', () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8387'
    setWindowOrigin('http://localhost:8386')

    expect(getPublicApiBaseUrl()).toBe('')
  })

  it('keeps non-localhost cross-origin URL', () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com'
    setWindowOrigin('https://app.example.com')

    expect(getPublicApiBaseUrl()).toBe('https://api.example.com')
  })
})
