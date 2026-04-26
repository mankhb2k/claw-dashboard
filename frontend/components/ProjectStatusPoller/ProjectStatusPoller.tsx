'use client'

import { useEffect, useMemo } from 'react'
import { useProjectStore } from '@/stores/project.store'

const POLL_MS = 2_500
const POLL_MAX_MS = 8 * 60_000

/**
 * Khi còn project CREATING/STARTING, refetch /api/projects/mine nền
 * (worker cập nhật RUNNING sau; danh sách tĩnh sẽ kẹt "Đang tạo" nếu không poll).
 * Đặt trong (dashboard) layout để cập nhật dù user đi sidebar (Settings) trong lúc tạo.
 */
export function ProjectStatusPoller() {
  const projects = useProjectStore((s) => s.projects)
  const fetchProjects = useProjectStore((s) => s.fetchProjects)

  const shouldPoll = useMemo(
    () =>
      projects.some(
        (p) => p.status === 'creating' || p.status === 'starting',
      ),
    [projects],
  )

  useEffect(() => {
    if (!shouldPoll) {
      return
    }
    const start = Date.now()

    void fetchProjects({ silent: true })

    const id = setInterval(() => {
      if (Date.now() - start > POLL_MAX_MS) {
        clearInterval(id)
        return
      }
      void fetchProjects({ silent: true })
    }, POLL_MS)

    const onVis = () => {
      if (document.visibilityState === 'visible') {
        void fetchProjects({ silent: true })
      }
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [shouldPoll, fetchProjects])

  return null
}
