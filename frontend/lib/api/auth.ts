import { api } from '@/lib/axios'
import { userSchema, type LoginInput, type RegisterInput, type User } from '@/schemas/auth.schema'

export const authApi = {
  login: async (input: LoginInput): Promise<User> => {
    await api.post('/api/auth/sign-in/email', input)
    return authApi.me()
  },

  register: async (input: Omit<RegisterInput, 'confirmPassword'>): Promise<User> => {
    await api.post('/api/auth/sign-up/email', {
      email: input.email,
      password: input.password,
      name: input.email.split('@')[0],
    })
    return authApi.me()
  },

  logout: async (): Promise<void> => {
    await api.post('/api/auth/sign-out')
  },

  me: async (): Promise<User> => {
    const res = await api.get('/api/auth/get-session')
    return userSchema.parse(res.data?.user)
  },

  signInGoogle: async (): Promise<void> => {
    const res = await api.post<{
      url?: string
      redirect?: boolean
    }>('/api/auth/sign-in/social', {
      provider: 'google',
      callbackURL: typeof window !== 'undefined' ? window.location.origin + '/' : undefined,
    })
    const url = res.data?.url
    if (url) {
      window.location.href = url
    }
  },

  signInGitHub: async (): Promise<void> => {
    const res = await api.post<{
      url?: string
      redirect?: boolean
    }>('/api/auth/sign-in/social', {
      provider: 'github',
      callbackURL: typeof window !== 'undefined' ? window.location.origin + '/' : undefined,
    })
    const url = res.data?.url
    if (url) {
      window.location.href = url
    }
  },
}
