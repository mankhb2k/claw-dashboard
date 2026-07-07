import { z } from 'zod'

export const publicUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
  createdAt: z.coerce.string(),
})

export type ProfileTranslate = (path: string) => string

export function createUpdateUserNameSchema(t: ProfileTranslate) {
  return z.object({
    name: z
      .string()
      .min(1, t('profile.validation.name.required'))
      .max(64, t('profile.validation.name.max')),
  })
}

export function createChangePasswordSchema(t: ProfileTranslate) {
  return z
    .object({
      currentPassword: z
        .string()
        .min(6, t('profile.validation.password.min'))
        .max(128),
      newPassword: z
        .string()
        .min(6, t('profile.validation.password.min'))
        .max(128),
      confirmPassword: z.string().min(6, t('profile.validation.password.min')),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
      message: t('profile.validation.confirmPassword.mismatch'),
      path: ['confirmPassword'],
    })
    .refine((d) => d.currentPassword !== d.newPassword, {
      message: t('profile.validation.newPassword.mustDiffer'),
      path: ['newPassword'],
    })
}

export type PublicUser = z.infer<typeof publicUserSchema>
export type UpdateUserNameInput = z.infer<
  ReturnType<typeof createUpdateUserNameSchema>
>
export type ChangePasswordInput = z.infer<
  ReturnType<typeof createChangePasswordSchema>
>
