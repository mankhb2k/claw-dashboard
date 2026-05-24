import { z } from 'zod'
import { projectApi } from '@/lib/api/project'
import { serverGet } from '@/lib/server-api'
import { projectSchema, type Project } from '@/schemas/project.schema'

const projectListSchema = z.array(projectSchema)

/** Active project for the logged-in user (1 user ≈ 1 project). */
export async function getCurrentProject(): Promise<Project | null> {
  try {
    const projects =
      typeof window !== 'undefined'
        ? await projectApi.list()
        : projectListSchema.parse(await serverGet('/api/projects/mine'))
    return projects[0] ?? null
  } catch (err) {
    console.error('[getCurrentProject]', err)
    return null
  }
}

export async function getCurrentProjectId(): Promise<string> {
  const project = await getCurrentProject()
  return project?.id ?? ''
}
