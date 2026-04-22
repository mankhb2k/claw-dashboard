import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
})

export const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Mật khẩu không khớp',
  path: ['confirmPassword'],
})

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  image: z.string().nullable().optional(),
  emailVerified: z.boolean().optional(),
  createdAt: z.coerce.string(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type User = z.infer<typeof userSchema>
