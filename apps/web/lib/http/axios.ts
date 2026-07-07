import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

import { setupMockInterceptor } from '@/lib/api/mocks'
import { getPublicApiBaseUrl } from '@/lib/http/api-base-url'
import { translate } from '@/lib/i18n/translate'

type AuthAxiosConfig = InternalAxiosRequestConfig & {
  /** Already retried after refresh — avoid infinite loop. */
  _retry?: boolean
  /** Refresh request — do not call refresh again on 401. */
  _skipAuthRefresh?: boolean
}

/** Do not attempt refresh (wrong password, expired refresh token, etc.). */
const AUTH_NO_REFRESH_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/logout',
  'sign-in',
  'sign-up',
  'sign-out',
] as const

function requestPath(url: string | undefined): string {
  const raw = url ?? ''
  try {
    return new URL(raw, 'http://localhost').pathname
  } catch {
    return raw.split('?')[0] ?? ''
  }
}

function shouldAttemptRefresh(url: string | undefined): boolean {
  const path = requestPath(url)
  return !AUTH_NO_REFRESH_PATHS.some((p) => path.includes(p))
}

function redirectToLogin(): void {
  if (typeof window === 'undefined') return
  const path = window.location.pathname
  if (path !== '/login' && path !== '/register') {
    window.location.assign('/login?session=expired')
  }
}

let refreshPromise: Promise<void> | null = null

const REFRESH_LOCK_KEY = 'oc_auth_refresh'
const REFRESH_LOCK_TTL_MS = 15_000
const PEER_REFRESH_WAIT_MS = 800

let tabId: string | null = null

function getTabId(): string {
  if (!tabId) {
    tabId = `tab_${Math.random().toString(36).slice(2, 11)}`
  }
  return tabId
}

type RefreshLockPayload = { at: number; tabId: string }

function readRefreshLock(): RefreshLockPayload | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(REFRESH_LOCK_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as RefreshLockPayload
    if (!parsed?.at || Date.now() - parsed.at > REFRESH_LOCK_TTL_MS) {
      localStorage.removeItem(REFRESH_LOCK_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function tryAcquireRefreshLock(id: string): boolean {
  if (typeof localStorage === 'undefined') return true
  const existing = readRefreshLock()
  if (existing && existing.tabId !== id) {
    return false
  }
  localStorage.setItem(REFRESH_LOCK_KEY, JSON.stringify({ at: Date.now(), tabId: id }))
  return true
}

function releaseRefreshLock(id: string): void {
  if (typeof localStorage === 'undefined') return
  const existing = readRefreshLock()
  if (existing?.tabId === id) {
    localStorage.removeItem(REFRESH_LOCK_KEY)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function waitForPeerRefresh(): Promise<void> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (!readRefreshLock()) {
      return
    }
    await sleep(PEER_REFRESH_WAIT_MS / 2)
  }
}

async function refreshAccessToken(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const id = getTabId()
      if (!tryAcquireRefreshLock(id)) {
        await waitForPeerRefresh()
        return
      }
      try {
        await api.post('/api/auth/refresh', {}, { _skipAuthRefresh: true } as AuthAxiosConfig)
      } finally {
        releaseRefreshLock(id)
      }
    })().finally(() => {
      refreshPromise = null
    })
  }
  await refreshPromise
}

export const api = axios.create({
  baseURL: getPublicApiBaseUrl(),
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60_000,
})

setupMockInterceptor(api)

api.interceptors.request.use((config) => {
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    config.headers.delete('Content-Type')
  }
  return config
})

api.interceptors.response.use(
  (res) => {
    const payload = res.data
    if (payload && typeof payload === 'object' && 'success' in payload) {
      return { ...res, data: (payload as { data: unknown }).data }
    }
    return res
  },
  async (err: AxiosError) => {
    const status = err.response?.status
    const config = err.config as AuthAxiosConfig | undefined
    const requestUrl = String(config?.url ?? '')

    if (status === 401 && typeof window !== 'undefined' && config) {
      if (config._skipAuthRefresh) {
        redirectToLogin()
        return Promise.reject(new Error(translate('http.sessionExpired')))
      }

      if (!config._retry && shouldAttemptRefresh(requestUrl)) {
        config._retry = true
        try {
          await refreshAccessToken()
          return api(config)
        } catch {
          redirectToLogin()
          return Promise.reject(new Error(translate('http.sessionExpired')))
        }
      }

      if (shouldAttemptRefresh(requestUrl)) {
        redirectToLogin()
        return Promise.reject(new Error(translate('http.sessionExpired')))
      }
    }

    if (!err.response) {
      const base = getPublicApiBaseUrl() || window.location.origin
      const hint =
        err.code === 'ECONNABORTED'
          ? translate('http.timeout')
          : translate('http.networkError', { base })
      return Promise.reject(new Error(hint))
    }

    const body = err.response.data as { error?: { message?: string }; message?: string }
    const message =
      body?.error?.message ??
      body?.message ??
      err.message ??
      translate('http.unknown')
    return Promise.reject(new Error(message))
  },
)
