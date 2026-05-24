import { z } from 'zod'

const loginId = z
  .string()
  .min(3, 'Tối thiểu 3 ký tự')
  .max(128, 'Tối đa 128 ký tự')
  .transform((v) => v.trim().toLowerCase())

export const loginSchema = z.object({
  login: loginId,
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
})

export const registerSchema = z
  .object({
    login: loginId,
    password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword'],
  })

export const userSchema = z.object({
  id: z.string(),
  login: z.string(),
  name: z.string(),
  createdAt: z.coerce.string(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type User = z.infer<typeof userSchema>
