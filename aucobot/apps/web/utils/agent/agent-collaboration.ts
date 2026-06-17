// LEGACY (rule .agent/rule.md §3.E + §7 nợ kỹ thuật): util này gọi API trực tiếp.
// TODO: chuyển sang hooks/agent/ hoặc thêm method vào lib/api/project. Không tạo thêm util kiểu này.
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
