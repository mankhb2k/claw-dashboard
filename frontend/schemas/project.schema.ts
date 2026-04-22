import { z } from 'zod'

// Backend trả uppercase, normalize về lowercase cho frontend
export const projectStatusSchema = z
  .string()
  .transform((v) => v.toLowerCase())
  .pipe(z.enum(['creating', 'running', 'starting', 'stopped', 'error']))

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  subdomain: z.string(),
  status: projectStatusSchema,
  containerName: z.string().nullable().optional(), // backend field
  lastActiveAt: z.coerce.string().nullable(),
  createdAt: z.coerce.string(),
})

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(3, 'Tên tối thiểu 3 ký tự')
    .max(32, 'Tên tối đa 32 ký tự')
    .regex(/^[a-z0-9-]+$/, 'Chỉ dùng chữ thường, số và dấu gạch ngang'),
})

export const projectHealthSchema = z.object({
  status: projectStatusSchema,
  subdomain: z.string().optional(),
  lastActiveAt: z.coerce.string().nullable().optional(),
  storageUsedMb: z.number().optional(),
})

export type Project = z.infer<typeof projectSchema>
export type ProjectStatus = z.infer<typeof projectStatusSchema>
export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type ProjectHealth = z.infer<typeof projectHealthSchema>
