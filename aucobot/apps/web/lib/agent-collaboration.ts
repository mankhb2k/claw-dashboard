import { projectApi } from '@/lib/api/project'
import { notifyCollaborationUpdated } from '@/lib/collaboration-events'

/** Add an agent slug to project collaboration (enables collaboration if needed). */
export async function addAgentToProjectCollaboration(
  projectId: string,
  slug: string,
): Promise<void> {
  const current = await projectApi.getCollaboration(projectId)
  const normalized = slug.trim().toLowerCase()
  if (!normalized || current.memberSlugs.includes(normalized)) {
    return
  }

  await projectApi.updateCollaboration(projectId, {
    enabled: true,
    memberSlugs: [...current.memberSlugs, normalized],
  })
  notifyCollaborationUpdated()
}
