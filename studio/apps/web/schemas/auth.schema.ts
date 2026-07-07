import { z } from 'zod'

export type AuthTranslate = (path: string) => string

function usernameField(t: AuthTranslate) {
  return z
    .string()
    .min(3, t('auth.validation.username.min'))
    .max(32, t('auth.validation.username.max'))
    .regex(/^[a-zA-Z0-9_-]+$/, t('auth.validation.username.pattern'))
    .transform((v) => v.trim().toLowerCase())
}

export function createLoginSchema(t: AuthTranslate) {
  return z.object({
    username: usernameField(t),
    password: z.string().min(6, t('auth.validation.password.min')),
  })
}

export function createRegisterSchema(t: AuthTranslate) {
  return z
    .object({
      username: usernameField(t),
      password: z.string().min(6, t('auth.validation.password.min')),
      confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
      message: t('auth.validation.confirmPassword.mismatch'),
      path: ['confirmPassword'],
    })
}

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string(),
  avatarUrl: z.string().nullable().optional(),
  createdAt: z.coerce.string(),
})

export type LoginInput = z.infer<ReturnType<typeof createLoginSchema>>
export type RegisterInput = z.infer<ReturnType<typeof createRegisterSchema>>
export type User = z.infer<typeof userSchema>
