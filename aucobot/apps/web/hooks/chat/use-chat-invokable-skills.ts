'use client'

import { useEffect, useMemo, useState } from 'react'

import { useProjectSkills } from '@/hooks/skill/use-project-skills'
import { projectApi } from '@/lib/api/project'
import { resolveInvokableSkills } from '@/utils/chat/skill-slash'

import type { InvokableSkill } from '@/utils/chat/skill-slash'

export function useChatInvokableSkills(projectId: string, agentId: string) {
  const { skills, loading: skillsLoading } = useProjectSkills(projectId, {
    enabled: Boolean(projectId),
  })
  const isMainAgent = agentId === 'main'
  const agentFetchKey =
    projectId && !isMainAgent ? `${projectId}:${agentId}` : ''

  const [agentSkillNames, setAgentSkillNames] = useState<string[] | null>(null)
  const [settledFetchKey, setSettledFetchKey] = useState<string | null>(null)

  const agentLoading =
    Boolean(agentFetchKey) && settledFetchKey !== agentFetchKey

  useEffect(() => {
    if (!agentFetchKey) return undefined

    let cancelled = false

    void projectApi
      .getAgent(projectId, agentId)
      .then((agent) => {
        if (cancelled) return
        setAgentSkillNames(agent.formData.skillNames)
      })
      .catch(() => {
        if (cancelled) return
        setAgentSkillNames([])
      })
      .finally(() => {
        if (!cancelled) setSettledFetchKey(agentFetchKey)
      })

    return () => {
      cancelled = true
    }
  }, [agentFetchKey, projectId, agentId])

  const invokableSkills = useMemo(
    (): InvokableSkill[] =>
      resolveInvokableSkills(
        skills,
        agentId,
        isMainAgent ? null : agentSkillNames,
      ),
    [skills, agentId, isMainAgent, agentSkillNames],
  )

  return {
    invokableSkills,
    loading: skillsLoading || agentLoading,
  }
}
