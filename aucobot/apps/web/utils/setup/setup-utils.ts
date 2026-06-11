import {
  isContainerMissing,
  isProjectBusy,
  isProjectReady,
} from '@/lib/routing/entry-route'
import type { Project, ProjectStatus } from '@/schemas/project.schema'

export type CloudSetupMode = 'create' | 'resume' | 'recreate' | 'ready'
export type OssSetupMode = 'create' | 'resume' | 'recover' | 'ready'

export const OSS_GATEWAY_ERROR_BODY =
  'Gateway is not reachable on port 18789. Run Openclaw and match OPENCLAW_GATEWAY_TOKEN in aucobot/.env.'

export function resolveCloudMode(project: Project | null): CloudSetupMode {
  if (!project) return 'create'
  if (isContainerMissing(project)) return 'recreate'
  if (project.status === 'error') return 'recreate'
  if (isProjectReady(project.status)) return 'ready'
  return 'resume'
}

export function resolveOssMode(project: Project | null): OssSetupMode {
  if (!project) return 'create'
  if (isProjectReady(project.status)) return 'ready'
  if (isProjectBusy(project.status)) return 'resume'
  return 'recover'
}

/** Avoid showing the same message twice (project.errorMessage + local/store error). */
export function resolveSetupError(
  project: Project | null,
  error: string | null | undefined,
): string | null {
  const message = error?.trim()
  if (!message) return null
  const projectMessage = project?.errorMessage?.trim()
  if (projectMessage && projectMessage === message) return null
  return message
}

export function statusLabel(status: ProjectStatus, missing: boolean, oss: boolean): string {
  if (oss) {
    switch (status) {
      case 'creating':
        return 'Preparing workspace…'
      case 'starting':
        return 'Connecting to gateway…'
      case 'error':
        return 'Setup error'
      case 'running':
        return 'Ready'
      default:
        return status
    }
  }

  if (missing) return 'Container removed — recreate required'
  switch (status) {
    case 'creating':
      return 'Creating container…'
    case 'starting':
      return 'Starting OpenClaw…'
    case 'stopping':
      return 'Stopping…'
    case 'stopped':
      return 'Stopped — start container'
    case 'error':
      return 'Runtime error'
    case 'running':
      return 'Ready'
    default:
      return status
  }
}
