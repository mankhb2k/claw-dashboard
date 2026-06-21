import { extractRefreshTokenFromRequest } from '@aucobot/control-plane-core'
import { describe, expect, it } from 'vitest'

describe('extractRefreshTokenFromRequest', () => {
  it('uses the last oc_refresh when duplicates are present', () => {
    const token = extractRefreshTokenFromRequest({
      headers: {
        cookie:
          'oc_refresh=stale-token; oc_access=x; oc_refresh=current-token',
      },
      cookies: { oc_refresh: 'stale-token' },
    })
    expect(token).toBe('current-token')
  })
})
