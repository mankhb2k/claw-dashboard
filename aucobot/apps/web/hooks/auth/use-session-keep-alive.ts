import { useEffect, useRef } from 'react'
import { authApi } from '@/lib/api/auth'

/** Poll interval — refresh before default 15m access TTL. */
const SESSION_KEEP_ALIVE_MS = 10 * 60 * 1000

/**
 * Keeps the session alive while the dashboard is open (silent refresh via GET /session).
 */
export function useSessionKeepAlive(): void {
  const tickingRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    const ping = async () => {
      if (tickingRef.current || cancelled) return
      tickingRef.current = true
      try {
        await authApi.me()
      } catch {
        // Refresh truly expired — axios interceptor handles redirect on next API call.
      } finally {
        tickingRef.current = false
      }
    }

    void ping()

    const intervalId = window.setInterval(() => {
      void ping()
    }, SESSION_KEEP_ALIVE_MS)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void ping()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])
}
