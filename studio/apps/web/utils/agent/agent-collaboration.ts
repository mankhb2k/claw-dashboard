// LEGACY (.agent/note.md §3.3): util calls API directly — move to hooks/agent/ or lib/api.
// TODO: move to hooks/agent/ or add a method on lib/api/project. Do not add more utils like this.
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { projectApi } from '@/lib/api/project'
import { notifyCollaborationUpdated } from '@/utils/agent/collaboration-events'

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
