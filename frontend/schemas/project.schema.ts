import { z } from 'zod'

// Backend trả uppercase, normalize về lowercase cho frontend
export const projectStatusSchema = z
  .string()
  .transform((v) => v.toLowerCase())
  .pipe(z.enum(['creating', 'running', 'starting', 'stopped', 'error']))

export const projectSchema = z
  .object({
    id: z.string(),
    displayName: z.string(),
    subdomain: z.string(),
    publicUrl: z.string().optional(),
    status: projectStatusSchema,
    containerName: z.string().nullable().optional(), // backend field
    lastActiveAt: z.coerce.string().nullable(),
    createdAt: z.coerce.string(),
  })
  .transform((p) => ({ ...p, name: p.displayName }))

export const createProjectSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Tên tối thiểu 1 ký tự')
    .max(200, 'Tên tối đa 200 ký tự'),
})

export const projectEnvEntrySchema = z.object({
  key: z.string().min(2).max(100),
  value: z.string().min(1).max(5000),
})

export const upsertProjectEnvSchema = z.object({
  env: z.array(projectEnvEntrySchema).min(1).max(100),
})

export const projectHealthSchema = z.object({
  status: projectStatusSchema,
  displayName: z.string().optional(),
  publicUrl: z.string().optional(),
  subdomain: z.string().optional(),
  lastActiveAt: z.coerce.string().nullable().optional(),
  storageUsedMb: z.number().optional(),
})

export type Project = z.infer<typeof projectSchema>
export type ProjectStatus = z.infer<typeof projectStatusSchema>
export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type ProjectHealth = z.infer<typeof projectHealthSchema>
export type ProjectEnvEntryInput = z.infer<typeof projectEnvEntrySchema>
export type UpsertProjectEnvInput = z.infer<typeof upsertProjectEnvSchema>
