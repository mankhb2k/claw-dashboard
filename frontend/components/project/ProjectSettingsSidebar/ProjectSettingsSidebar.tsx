'use client'

import * as Separator from '@radix-ui/react-separator'
import { FaXmark } from 'react-icons/fa6'
import { Button } from '@/components/ui/Button/Button'
import type { Project, ProjectHealth } from '@/schemas/project.schema'
import styles from './ProjectSettingsSidebar.module.css'

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

interface ProjectSettingsSidebarProps {
  project: Project
  health: ProjectHealth | null
  isOpen: boolean
  onClose: () => void
  onStart: () => Promise<void>
  onStop: () => Promise<void>
  onDestroy: () => Promise<void>
  isActing: boolean
  isDestroying: boolean
  healthError: string | null
  onRefreshHealth: () => void
}

export function ProjectSettingsSidebar({
  project,
  health,
  isOpen,
  onClose,
  onStart,
  onStop,
  onDestroy,
  isActing,
  isDestroying,
  healthError,
  onRefreshHealth,
}: ProjectSettingsSidebarProps) {
  const publicDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'clawsandbox.cloud'
  const displayName = project.displayName || project.name
  const statusRaw = project.status?.toUpperCase() || health?.status?.toUpperCase() || ''
  const isRunning = statusRaw === 'RUNNING'
  const isBusy = statusRaw === 'STARTING' || statusRaw === 'CREATING' || statusRaw === 'STOPPING'
  const publicUrl =
    project.publicUrl ??
    (project.subdomain
      ? `https://${project.subdomain}.${publicDomain}`
      : health?.publicUrl ?? (health?.subdomain ? `https://${health.subdomain}.${publicDomain}` : null))

  return (
    <>
      <button
        type="button"
        className={[styles.overlay, isOpen ? styles.overlayOpen : ''].join(' ')}
        onClick={onClose}
        aria-label="Đóng sidebar cài đặt"
      />

      <aside
        className={[styles.sidebar, isOpen ? styles.sidebarOpen : ''].join(' ')}
        aria-hidden={!isOpen}
      >
        <div className={styles.header}>
          <div className={styles.titleBlock}>
            <h2 className={styles.title}>{displayName}</h2>
            <span
              className={[
                styles.badge,
                styles[`badge--${(statusRaw || 'STOPPED').toLowerCase()}` as keyof typeof styles],
              ].join(' ')}
            >
              {isBusy && <span className={styles.badgeSpinner} />}
              {STATUS_LABEL[statusRaw] ?? project.status}
            </span>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Đóng"
            title="Đóng"
          >
            <FaXmark size={14} aria-hidden />
          </button>
        </div>

        <Separator.Root className={styles.separator} />

        <div className={styles.body}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Điều khiển</h3>
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
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    loading={isActing}
                    onClick={() => void onStop()}
                  >
                    Dừng
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  loading={isActing || isBusy}
                  onClick={() => void onStart()}
                  disabled={isBusy}
                >
                  Khởi động
                </Button>
              )}
            </div>
          </section>

          <Separator.Root className={styles.separator} />

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Thông tin</h3>
            <div className={styles.dl}>
              <div className={styles.row}>
                <span className={styles.dt}>Subdomain</span>
                <span className={styles.dd}>{project.subdomain}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.dt}>Public URL</span>
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
                  <span className={styles.dd}>Chưa có URL công khai</span>
                )}
              </div>
              <div className={styles.row}>
                <span className={styles.dt}>Tạo lúc</span>
                <span className={styles.dd}>{formatWhen(project.createdAt)}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.dt}>Hoạt động gần nhất</span>
                <span className={styles.dd}>{formatWhen(health?.lastActiveAt ?? project.lastActiveAt)}</span>
              </div>
              {typeof health?.storageUsedMb === 'number' && (
                <div className={styles.row}>
                  <span className={styles.dt}>Dung lượng</span>
                  <span className={styles.dd}>{Math.round(health.storageUsedMb)} MB</span>
                </div>
              )}
              {project.containerName && (
                <div className={styles.row}>
                  <span className={styles.dt}>Container</span>
                  <span className={styles.dd}>{project.containerName}</span>
                </div>
              )}
            </div>
            {healthError && <p className={styles.error}>{healthError}</p>}
            <div className={styles.refreshWrap}>
              <Button type="button" size="sm" variant="ghost" onClick={onRefreshHealth}>
                Cập nhật thông tin
              </Button>
            </div>
          </section>

          <Separator.Root className={styles.separator} />

          <section className={[styles.section, styles.danger].join(' ')}>
            <h3 className={styles.sectionTitle}>Khu vực nguy hiểm</h3>
            <p className={styles.dangerNote}>
              Xoá project chỉ thực hiện được khi container đang dừng. Mọi dữ liệu trong project sẽ
              bị gỡ.
            </p>
            <Button
              type="button"
              size="sm"
              variant="danger"
              loading={isDestroying}
              onClick={() => void onDestroy()}
              disabled={isBusy}
            >
              Xóa project
            </Button>
          </section>
        </div>
      </aside>
    </>
  )
}
