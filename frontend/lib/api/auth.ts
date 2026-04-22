import { api } from '@/lib/axios'
import { userSchema, type LoginInput, type RegisterInput, type User } from '@/schemas/auth.schema'

export const authApi = {
  login: async (input: LoginInput): Promise<User> => {
    const res = await api.post('/api/auth/login', input)
    // Backend: { success, data: { user: {...} } } → unwrapped → { user: {...} }
    return userSchema.parse(res.data.user)
  },

  register: async (input: Omit<RegisterInput, 'confirmPassword'>): Promise<User> => {
    const res = await api.post('/api/auth/register', input)
    return userSchema.parse(res.data.user)
  },

  logout: async (): Promise<void> => {
    await api.post('/api/auth/logout')
  },

  // Backend endpoint is GET /api/auth/session (not /me)
  me: async (): Promise<User> => {
    const res = await api.get('/api/auth/session')
    return userSchema.parse(res.data.user)
  },
}
