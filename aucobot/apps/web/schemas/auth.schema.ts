import { z } from 'zod'

const usernameField = z
  .string()
  .min(3, 'Tối thiểu 3 ký tự')
  .max(32, 'Tối đa 32 ký tự')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Chỉ dùng chữ, số, gạch dưới và gạch ngang',
  )
  .transform((v) => v.trim().toLowerCase())

export const loginSchema = z.object({
  username: usernameField,
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
})

export const registerSchema = z
  .object({
    username: usernameField,
    password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword'],
  })

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string(),
  avatarUrl: z.string().nullable().optional(),
  createdAt: z.coerce.string(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type User = z.infer<typeof userSchema>
