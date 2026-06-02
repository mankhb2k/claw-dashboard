import { z } from 'zod'

export const publicUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
  createdAt: z.coerce.string(),
})

export const updateUserNameSchema = z.object({
  name: z.string().min(1, 'Name is required').max(64, 'Max 64 characters'),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, 'Min 6 characters').max(128),
    newPassword: z.string().min(6, 'Min 6 characters').max(128),
    confirmPassword: z.string().min(6, 'Min 6 characters'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: 'New password must differ from current',
    path: ['newPassword'],
  })

export type PublicUser = z.infer<typeof publicUserSchema>
export type UpdateUserNameInput = z.infer<typeof updateUserNameSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
