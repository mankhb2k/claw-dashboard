import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { setupMockInterceptor } from '@/lib/api/mocks'
import { getPublicApiBaseUrl } from '@/lib/api-base-url'

type AuthAxiosConfig = InternalAxiosRequestConfig & {
  /** Đã retry sau refresh — tránh vòng lặp. */
  _retry?: boolean
  /** Request refresh — không gọi refresh lại khi 401. */
  _skipAuthRefresh?: boolean
}

/** Không cố refresh (sai mật khẩu, refresh hết hạn, …). */
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

async function refreshAccessToken(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = api
      .post('/api/auth/refresh', {}, { _skipAuthRefresh: true } as AuthAxiosConfig)
      .then(() => undefined)
      .finally(() => {
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

api.interceptors.response.use(
  (res) => {
    if (res.data && typeof res.data === 'object' && 'success' in res.data) {
      res.data = res.data.data
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
        return Promise.reject(
          new Error('Phiên đăng nhập hết hạn. Đang chuyển tới trang đăng nhập…'),
        )
      }

      if (!config._retry && shouldAttemptRefresh(requestUrl)) {
        config._retry = true
        try {
          await refreshAccessToken()
          return api(config)
        } catch {
          redirectToLogin()
          return Promise.reject(
            new Error('Phiên đăng nhập hết hạn. Đang chuyển tới trang đăng nhập…'),
          )
        }
      }

      if (shouldAttemptRefresh(requestUrl)) {
        redirectToLogin()
        return Promise.reject(
          new Error('Phiên đăng nhập hết hạn. Đang chuyển tới trang đăng nhập…'),
        )
      }
    }

    if (!err.response) {
      const base = getPublicApiBaseUrl() || window.location.origin
      const hint =
        err.code === 'ECONNABORTED'
          ? 'Request quá thời gian chờ.'
          : `Không kết nối được API (${base}). Kiểm tra backend đang chạy (npm run dev trong thư mục backend).`
      return Promise.reject(new Error(hint))
    }

    const body = err.response.data as { error?: { message?: string }; message?: string }
    const message =
      body?.error?.message ?? body?.message ?? err.message ?? 'Lỗi không xác định'
    return Promise.reject(new Error(message))
  },
)
