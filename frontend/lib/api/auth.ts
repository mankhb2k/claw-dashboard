import { api } from '@/lib/axios'
import { userSchema, type LoginInput, type RegisterInput, type User } from '@/schemas/auth.schema'

export const authApi = {
  login: async (input: LoginInput): Promise<User> => {
    await api.post('/api/auth/signin/email', input)
    return authApi.me()
  },

  register: async (input: Omit<RegisterInput, 'confirmPassword'>): Promise<User> => {
    await api.post('/api/auth/signup/email', {
      email: input.email,
      password: input.password,
      name: input.email.split('@')[0],
    })
    return authApi.me()
  },

  logout: async (): Promise<void> => {
    await api.post('/api/auth/signout')
  },

  me: async (): Promise<User> => {
    const res = await api.get('/api/auth/sessions')
    return userSchema.parse(res.data?.user)
  },

  signInGoogle: (): void => {
    const baseURL = api.defaults.baseURL ?? 'http://localhost:3001'
    window.location.href = `${baseURL}/api/auth/signin/google`
  },

  signInGitHub: (): void => {
    const baseURL = api.defaults.baseURL ?? 'http://localhost:3001'
    window.location.href = `${baseURL}/api/auth/signin/github`
  },
}
