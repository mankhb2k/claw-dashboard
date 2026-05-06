'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useProjectStore } from '@/stores/project.store'
import { projectApi } from '@/lib/api/project'
import { Header } from '@/components/layout/Header/Header'
import { Button } from '@/components/ui/Button/Button'
import type { ProjectHealth } from '@/schemas/project.schema'
import { extractProjectIdFromSegment } from '@/lib/project-route'
import styles from '../projects/[id]/project-detail.module.css'

const STATUS_LABEL: Record<string, string> = {
  RUNNING: 'Đang chạy',
  STOPPED: 'Đã dừng',
  STARTING: 'Đang khởi động...',
  STOPPING: 'Đang dừng...',
  CREATING: 'Đang tạo...',
  ERROR: 'Lỗi',
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('vi-VN')
  } catch {
    return '—'
  }
}

interface Props {
  projectSegment: string
}

export function ProjectDetailContent({ projectSegment }: Props) {
  const id = useMemo(() => extractProjectIdFromSegment(projectSegment), [projectSegment])

  const project = useProjectStore((s) => s.projects.find((p) => p.id === id))
  const fetchProjects = useProjectStore((s) => s.fetchProjects)
  const startProject = useProjectStore((s) => s.startProject)
  const stopProject = useProjectStore((s) => s.stopProject)
  const pollHealth = useProjectStore((s) => s.pollHealth)

  const [health, setHealth] = useState<ProjectHealth | null>(null)
  const [healthError, setHealthError] = useState<string | null>(null)
  const [isActing, setIsActing] = useState(false)
  const [fetched, setFetched] = useState(false)

  useEffect(() => {
    if (!id) return
    setFetched(false)
    void fetchProjects().finally(() => setFetched(true))
  }, [id, fetchProjects])

  const loadHealth = useCallback(() => {
    if (!id) return
    setHealthError(null)
    return projectApi
      .health(id)
      .then(setHealth)
      .catch((err) => {
        setHealthError(err instanceof Error ? err.message : 'Không tải được health')
      })
  }, [id])

  useEffect(() => {
    if (!project) return
    void loadHealth()
  }, [project, loadHealth])

  useEffect(() => {
    if (!id || !project) return
    const s = project.status?.toUpperCase() ?? ''
    if (s !== 'STARTING' && s !== 'STOPPING' && s !== 'CREATING') {
      return
    }
    const t = setInterval(() => {
      void loadHealth()
    }, 2_500)
    return () => clearInterval(t)
  }, [id, project, loadHealth])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [id])

  const publicDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'clawsandbox.cloud'
  const p = project
  const displayName = p ? p.displayName || p.name : health?.displayName
  const statusRaw = p?.status?.toUpperCase() || health?.status?.toUpperCase() || ''
  const isRunning = statusRaw === 'RUNNING'
  const isBusy = statusRaw === 'STARTING' || statusRaw === 'CREATING' || statusRaw === 'STOPPING'
  const publicUrl =
    p?.publicUrl ??
    (p?.subdomain
      ? `https://${p.subdomain}.${publicDomain}`
      : health?.publicUrl ?? (health?.subdomain ? `https://${health.subdomain}.${publicDomain}` : null))

  const handleStart = async () => {
    if (!id) return
    setIsActing(true)
    try {
      await startProject(id)
      const stopPolling = pollHealth(id, (url) => {
        stopPolling()
        if (url) window.open(url, '_blank')
      })
      void loadHealth()
    } finally {
      setIsActing(false)
    }
  }

  const handleStop = async () => {
    if (!id) return
    setIsActing(true)
    try {
      await stopProject(id)
      void loadHealth()
    } finally {
      setIsActing(false)
    }
  }

  if (!id) {
    return (
      <>
        <Header title="Project" />
        <div className={styles.page}>
          <p className={styles.error}>Mã project không hợp lệ</p>
        </div>
      </>
    )
  }

  if (!p && !fetched) {
    return (
      <>
        <Header title="Project" />
        <div className={styles.state}>
          <span className={styles.spinner} />
          <p>Đang tải...</p>
        </div>
      </>
    )
  }

  if (fetched && !p) {
    return (
      <>
        <Header title="Không tìm thấy" />
        <div className={styles.page}>
          <Link className={styles.back} href="/projects">
            ← Về danh sách
          </Link>
          <p>Không tìm thấy project hoặc bạn không có quyền truy cập.</p>
          <div style={{ marginTop: 16 }}>
            <Button asChild>
              <Link href="/projects">Quay lại Projects</Link>
            </Button>
          </div>
        </div>
      </>
    )
  }

  if (!p) return null

  return (
    <>
      <Header title={displayName ?? 'Project'} />

      <div className={styles.page}>
        <Link className={styles.back} href="/projects">
          ← Tất cả project
        </Link>
        <section id="overview" className={styles.overviewCard}>
          <div className={styles.head}>
            <div className={styles.titleBlock}>
              <h1 className={styles.title}>{displayName}</h1>
              <div>
                <span
                  className={[
                    styles.badge,
                    styles[`badge--${(statusRaw || 'STOPPED').toLowerCase()}` as keyof typeof styles],
                  ].join(' ')}
                >
                  {isBusy && <span className={styles.badgeSpinner} />}
                  {STATUS_LABEL[statusRaw] ?? p.status}
                </span>
              </div>
              <div className={styles.urlRow}>
                {publicUrl ? (
                  <a
                    className={styles.url}
                    href={isRunning ? publicUrl : undefined}
                    rel="noreferrer"
                    target={isRunning ? '_blank' : undefined}
                  >
                    {publicUrl}
                  </a>
                ) : (
                  <span className={styles.urlMuted}>
                    Chưa có URL công khai (khởi động project để cấp)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.quickInfo}>
            <div className={styles.quickItem}>
              <span className={styles.quickLabel}>Subdomain</span>
              <span className={styles.quickValue}>{p.subdomain}</span>
            </div>
            <div className={styles.quickItem}>
              <span className={styles.quickLabel}>Hoạt động gần nhất</span>
              <span className={styles.quickValue}>
                {formatWhen(health?.lastActiveAt ?? p.lastActiveAt)}
              </span>
            </div>
            <div className={styles.quickItem}>
              <span className={styles.quickLabel}>Tạo lúc</span>
              <span className={styles.quickValue}>{formatWhen(p.createdAt)}</span>
            </div>
          </div>
          {healthError ? <p className={styles.error}>{healthError}</p> : null}
        </section>

        <section id="controls" className={styles.panel}>
          <h2 className={styles.panelTitle}>Điều khiển</h2>
          <div className={styles.actions}>
            {isRunning ? (
              <>
                {publicUrl && (
                  <Button asChild size="sm" variant="ghost">
                    <a href={publicUrl} rel="noopener noreferrer" target="_blank">
                      Mở dashboard
                    </a>
                  </Button>
                )}
                <Button type="button" size="sm" variant="danger" loading={isActing} onClick={handleStop}>
                  Dừng
                </Button>
              </>
            ) : (
              <Button
                type="button"
                size="sm"
                loading={isActing || isBusy}
                onClick={handleStart}
                disabled={isBusy}
              >
                Khởi động
              </Button>
            )}
          </div>
          <div className={styles.refreshWrap}>
            <Button asChild size="sm" variant="ghost">
              <Link href={`/project/${encodeURIComponent(projectSegment)}/setting`}>Cài đặt · gateway token · xóa project</Link>
            </Button>
          </div>
        </section>
      </div>
    </>
  )
}
