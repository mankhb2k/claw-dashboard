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

  signInGoogle: (): void => {
    const baseURL = api.defaults.baseURL ?? 'http://localhost:3001'
    window.location.href = `${baseURL}/api/auth/sign-in/google`
  },

  signInGitHub: (): void => {
    const baseURL = api.defaults.baseURL ?? 'http://localhost:3001'
    window.location.href = `${baseURL}/api/auth/sign-in/github`
  },
}
