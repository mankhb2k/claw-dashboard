'use client'

import { useState } from 'react'
import { useProjectStore } from '@/stores/project.store'
import { Button } from '@/components/ui/Button/Button'
import type { Project } from '@/schemas/project.schema'
import styles from './ProjectCard.module.css'

const STATUS_LABEL: Record<string, string> = {
  running: 'Đang chạy',
  stopped: 'Đã dừng',
  starting: 'Đang khởi động...',
  creating: 'Đang tạo...',
  error: 'Lỗi',
}

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const startProject = useProjectStore((s) => s.startProject)
  const stopProject = useProjectStore((s) => s.stopProject)
  const pollHealth = useProjectStore((s) => s.pollHealth)
  const [isActing, setIsActing] = useState(false)

  const handleStart = async () => {
    setIsActing(true)
    try {
      await startProject(project.id)
      const stopPolling = pollHealth(project.id, (url) => {
        stopPolling()
        if (url) window.open(`https://${project.subdomain}.openclaw.ai`, '_blank')
      })
    } finally {
      setIsActing(false)
    }
  }

  const handleStop = async () => {
    setIsActing(true)
    try {
      await stopProject(project.id)
    } finally {
      setIsActing(false)
    }
  }

  const isRunning = project.status === 'running'
  const isBusy = project.status === 'starting' || project.status === 'creating'
  const url = `https://${project.subdomain}.openclaw.ai`

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <div>
          <h3 className={styles.name}>{project.name}</h3>
          <p className={styles.subdomain}>{project.subdomain}.openclaw.ai</p>
        </div>
        <span className={[styles.badge, styles[`badge--${project.status}`]].join(' ')}>
          {isBusy && <span className={styles.badgeSpinner} />}
          {STATUS_LABEL[project.status] ?? project.status}
        </span>
      </div>

      <div className={styles.actions}>
        {isRunning ? (
          <>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="ghost">Mở dashboard</Button>
            </a>
            <Button size="sm" variant="danger" loading={isActing} onClick={handleStop}>
              Dừng
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            loading={isActing || isBusy}
            onClick={handleStart}
            disabled={isBusy}
          >
            Khởi động
          </Button>
        )}
      </div>
    </div>
  )
}
