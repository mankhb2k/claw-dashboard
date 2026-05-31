import { projectApi } from '@/lib/api/project'
import type { Project, ProjectStatus } from '@/schemas/project.schema'
import { getDashboardPath } from '@/lib/dashboard-route'
import { isOssRuntime } from '@/lib/runtime-mode'

export const SETUP_PATH = '/setup'

const READY_STATUSES: ProjectStatus[] = ['running']
const BUSY_STATUSES: ProjectStatus[] = ['creating', 'starting', 'stopping']

export function isProjectReady(status: ProjectStatus): boolean {
  return READY_STATUSES.includes(status)
}

export function isProjectBusy(status: ProjectStatus): boolean {
  return BUSY_STATUSES.includes(status)
}

export function getPrimaryProject(projects: Project[]): Project | null {
  return projects[0] ?? null
}

export function isContainerMissing(project: Project): boolean {
  if (isOssRuntime()) return false
  return project.containerMissing === true
}

/** Whether the user must stay on /setup before using the dashboard. */
export function shouldRedirectToSetup(project: Project | null): boolean {
  if (!project) return true

  if (isOssRuntime()) {
    return !isProjectReady(project.status)
  }

  if (isContainerMissing(project)) return true
  if (isProjectBusy(project.status)) return false
  return !isProjectReady(project.status)
}

export async function resolveEntryPath(): Promise<string> {
  try {
    const projects = await projectApi.list()
    const primary = getPrimaryProject(projects)
    if (shouldRedirectToSetup(primary)) {
      return SETUP_PATH
    }
    return getDashboardPath()
  } catch {
    return SETUP_PATH
  }
}
