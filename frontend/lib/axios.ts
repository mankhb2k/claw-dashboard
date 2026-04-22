import axios from 'axios'
import { setupMockInterceptor } from '@/lib/api/mocks'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
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
    // Extract error message from backend wrapper or fallback
    const body = err.response?.data
    const message =
      body?.error?.message ?? body?.message ?? err.message ?? 'Lỗi không xác định'
    return Promise.reject(new Error(message))
  }
)
