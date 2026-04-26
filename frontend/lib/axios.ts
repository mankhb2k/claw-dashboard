import axios from 'axios'
import { setupMockInterceptor } from '@/lib/api/mocks'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60_000,
})

// Setup mock API interceptor nếu NEXT_PUBLIC_MOCK_API=true
setupMockInterceptor(api)

api.interceptors.response.use(
  (res) => {
    // Unwrap backend response: { success, data, error } → res.data = data
    if (res.data && typeof res.data === 'object' && 'success' in res.data) {
      res.data = res.data.data
    }
    return res
  },
  (err) => {
    const status = err.response?.status
    const requestUrl = String(err.config?.url ?? '')

    // Session lost while user is on a protected page: send to login (not on wrong-password responses)
    if (
      status === 401 &&
      typeof window !== 'undefined' &&
      !requestUrl.includes('sign-in') &&
      !requestUrl.includes('sign-up') &&
      !requestUrl.includes('get-session') &&
      !requestUrl.includes('sign-out')
    ) {
      const path = window.location.pathname
      if (path !== '/login' && path !== '/register') {
        window.location.assign('/login?session=expired')
      }
      // Must reject: a never-resolving Promise leaves UI (e.g. form isSubmitting) stuck forever
      return Promise.reject(new Error('Phiên đăng nhập hết hạn. Đang chuyển tới trang đăng nhập…'))
    }

    // Extract error message from backend wrapper or fallback
    const body = err.response?.data
    const message =
      body?.error?.message ?? body?.message ?? err.message ?? 'Lỗi không xác định'
    return Promise.reject(new Error(message))
  }
)
