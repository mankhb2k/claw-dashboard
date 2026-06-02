import { api } from '@/lib/axios'
import { uploadMultipart } from '@/lib/api/multipart-upload'
import {
  changePasswordSchema,
  publicUserSchema,
  updateUserNameSchema,
  type ChangePasswordInput,
  type PublicUser,
  type UpdateUserNameInput,
} from '@/schemas/user.schema'

export const usersApi = {
  me: async (): Promise<PublicUser> => {
    const res = await api.get('/api/users/me')
    return publicUserSchema.parse(res.data)
  },

  updateName: async (input: UpdateUserNameInput): Promise<PublicUser> => {
    const body = updateUserNameSchema.parse(input)
    const res = await api.patch('/api/users/me/name', body)
    return publicUserSchema.parse(res.data)
  },

  uploadAvatar: async (file: File): Promise<PublicUser> => {
    const form = new FormData()
    form.append('file', file)
    const data = await uploadMultipart('/api/users/me/avatar', form, 'PUT')
    return publicUserSchema.parse(data)
  },

  deleteAvatar: async (): Promise<PublicUser> => {
    const res = await api.delete('/api/users/me/avatar')
    return publicUserSchema.parse(res.data)
  },

  changePassword: async (input: ChangePasswordInput): Promise<void> => {
    const parsed = changePasswordSchema.parse(input)
    await api.patch('/api/users/me/password', {
      currentPassword: parsed.currentPassword,
      newPassword: parsed.newPassword,
    })
  },
}
