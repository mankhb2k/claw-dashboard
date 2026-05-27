import { api } from '@/lib/axios'
import type { LoginInput, RegisterInput, User } from '@/schemas/auth.schema'

export const authApi = {
  login: async (input: LoginInput): Promise<User> => {
    const res = await api.post<{ user: User }>('/api/auth/login', input)
    return res.data.user
  },

  register: async (input: RegisterInput): Promise<User> => {
    const res = await api.post<{ user: User }>('/api/auth/register', {
      username: input.username,
      password: input.password,
      name: input.username,
    })
    return res.data.user
  },

  logout: async (): Promise<void> => {
    await api.post('/api/auth/logout')
  },

  me: async (): Promise<User> => {
    const res = await api.get<{ user: User }>('/api/auth/session')
    return res.data.user
  },
}
