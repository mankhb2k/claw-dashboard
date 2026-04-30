'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useProjectStore } from '@/stores/project.store'
import { Button } from '@/components/ui/Button/Button'
import type { Project } from '@/schemas/project.schema'
import styles from './ProjectCard.module.css'

const STATUS_LABEL: Record<string, string> = {
  RUNNING: 'Đang chạy',
  STOPPED: 'Đã dừng',
  STARTING: 'Đang khởi động...',
  STOPPING: 'Đang dừng...',
  CREATING: 'Đang tạo...',
  ERROR: 'Lỗi',
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
        if (url) window.open(url, '_blank')
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

  const status = project.status?.toUpperCase() || ''
  const isRunning = status === 'RUNNING'
  const isBusy = status === 'STARTING' || status === 'CREATING' || status === 'STOPPING'
  const publicDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'clawsandbox.cloud'
  const url = project.publicUrl ?? `https://${project.subdomain}.${publicDomain}`

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <div>
          <Link className={styles.nameLink} href={`/projects/${project.id}`}>
            <h3 className={styles.name}>{project.displayName || project.name}</h3>
          </Link>
          <p className={styles.subdomain}>
            {new URL(url).host}
          </p>
        </div>
        <span className={[styles.badge, styles[`badge--${status.toLowerCase()}`]].join(' ')}>
          {isBusy && <span className={styles.badgeSpinner} />}
          {STATUS_LABEL[status] ?? project.status}
        </span>
      </div>

      <div className={styles.actions}>
        {isRunning ? (
          <>
            <Button asChild size="sm" variant="ghost">
              <a href={url} target="_blank" rel="noopener noreferrer">Mở dashboard</a>
            </Button>
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
