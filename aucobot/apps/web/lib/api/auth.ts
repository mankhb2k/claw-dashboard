import { api } from '@/lib/axios'
import { userSchema, type LoginInput, type RegisterInput, type User } from '@/schemas/auth.schema'

export const authApi = {
  login: async (input: LoginInput): Promise<User> => {
    const res = await api.post<{ user: User }>('/api/auth/login', input)
    return userSchema.parse(res.data.user)
  },

  register: async (input: Omit<RegisterInput, 'confirmPassword'>): Promise<User> => {
    const res = await api.post<{ user: User }>('/api/auth/register', {
      login: input.login,
      password: input.password,
      name: input.login.includes('@') ? input.login.split('@')[0] : input.login,
    })
    return userSchema.parse(res.data.user)
  },

  logout: async (): Promise<void> => {
    await api.post('/api/auth/logout')
  },

  me: async (): Promise<User> => {
    const res = await api.get<{ user: User }>('/api/auth/session')
    return userSchema.parse(res.data.user)
  },
}
