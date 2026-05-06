'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { useProjectStore } from '@/stores/project.store'
import { projectApi } from '@/lib/api/project'
import { Header } from '@/components/layout/Header/Header'
import { Button } from '@/components/ui/Button/Button'
import type { ProjectHealth } from '@/schemas/project.schema'
import { extractProjectIdFromSegment } from '@/lib/project-route'
import detailStyles from '../projects/[id]/project-detail.module.css'
import settingsStyles from './project-settings.module.css'

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

export function ProjectSettingsContent({ projectSegment }: Props) {
  const router = useRouter()
  const id = useMemo(() => extractProjectIdFromSegment(projectSegment), [projectSegment])

  const project = useProjectStore((s) => s.projects.find((p) => p.id === id))
  const fetchProjects = useProjectStore((s) => s.fetchProjects)
  const destroyProject = useProjectStore((s) => s.destroyProject)

  const [health, setHealth] = useState<ProjectHealth | null>(null)
  const [healthError, setHealthError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [tokenLoading, setTokenLoading] = useState(false)
  const [tokenVisible, setTokenVisible] = useState(false)
  const [isDestroying, setIsDestroying] = useState(false)
  const [fetched, setFetched] = useState(false)
  const [copyDone, setCopyDone] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)

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
      .catch(() => setHealthError('Không tải được health'))
  }, [id])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [id])

  useEffect(() => {
    setToken(null)
    setTokenError(null)
    setTokenVisible(false)
  }, [id])

  /** Chỉ phụ thuộc fetched/id: `project` từ store đổi reference mỗi lần poll → tránh lặp vô hạn. */
  useEffect(() => {
    if (!id || !fetched) return
    if (!useProjectStore.getState().projects.some((p) => p.id === id)) return
    void loadHealth()
  }, [id, fetched, loadHealth])

  const loadToken = useCallback(async () => {
    if (!id) return
    setTokenLoading(true)
    setTokenError(null)
    try {
      const res = await projectApi.gatewayToken(id)
      setToken(res.token)
    } catch {
      setToken(null)
      setTokenError(
        'Chưa lấy được gateway token (backend có thể chưa bật endpoint). Khi có API, giá trị sẽ hiển thị tại đây.',
      )
    } finally {
      setTokenLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (!id || !fetched) return
    if (!useProjectStore.getState().projects.some((p) => p.id === id)) return
    void loadToken()
  }, [id, fetched, loadToken])

  const publicDomainRaw = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'clawsandbox.cloud'
  const publicHost =
    publicDomainRaw.replace(/^https?:\/\//i, '').split('/')[0].replace(/:\d+$/, '').trim() ||
    'clawsandbox.cloud'
  const p = project
  const displayName = p ? p.displayName || p.name : ''
  const statusRaw = p?.status?.toUpperCase() || ''
  const isBusy = statusRaw === 'STARTING' || statusRaw === 'CREATING' || statusRaw === 'STOPPING'

  const handleDestroy = async () => {
    if (!id || !p) return
    const st = p.status?.toLowerCase() ?? ''
    if (st !== 'stopped' && st !== 'error') {
      setAlertMessage('Chỉ xóa được khi project đã dừng (trạng thái Đã dừng hoặc Lỗi).')
      return
    }
    setShowDeleteModal(true)
  }

  const confirmDestroy = async () => {
    if (!id || !p) return
    setShowDeleteModal(false)
    setIsDestroying(true)
    try {
      await destroyProject(id)
      router.push('/projects')
    } catch (err) {
      setAlertMessage(err instanceof Error ? err.message : 'Xóa thất bại')
    } finally {
      setIsDestroying(false)
    }
  }

  const handleCopy = async () => {
    if (!token) return
    try {
      await navigator.clipboard.writeText(token)
      setCopyDone(true)
      window.setTimeout(() => setCopyDone(false), 2000)
    } catch {
      setAlertMessage('Không copy được — thử chọn tay hoặc kiểm tra quyền trình duyệt.')
    }
  }

  if (!id) {
    return (
      <>
        <Header title="Cài đặt" />
        <div className={detailStyles.page}>
          <p className={detailStyles.error}>Mã project không hợp lệ</p>
        </div>
      </>
    )
  }

  if (!p && !fetched) {
    return (
      <>
        <Header title="Cài đặt" />
        <div className={detailStyles.state}>
          <span className={detailStyles.spinner} />
          <p>Đang tải...</p>
        </div>
      </>
    )
  }

  if (fetched && !p) {
    return (
      <>
        <Header title="Không tìm thấy" />
        <div className={detailStyles.page}>
          <Link className={detailStyles.back} href="/projects">
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
      <Header title="Cài đặt project" />

      <div className={detailStyles.page}>
        <Link className={detailStyles.back} href="/projects">
          ← Tất cả project
        </Link>

        <p className={settingsStyles.lead}>
          <strong>{displayName}</strong>
          {' · '}
          <span className={settingsStyles.subtleBadge}>subdomain: {p.subdomain}</span>
        </p>

        <section className={detailStyles.panel}>
          <h2 className={detailStyles.panelTitle}>Gateway token</h2>
          <div className={settingsStyles.tokenBlock}>
            <p className={settingsStyles.tokenHint}>
              Dùng cho OpenClaw Gateway (CLI, tích hập nội bộ). Giữ bí mật như mật khẩu; ai có token có thể
              điều khiển gateway của project qua HTTP.
            </p>
            {tokenLoading && (
              <p className={settingsStyles.tokenHint} aria-live="polite">
                Đang tải token…
              </p>
            )}
            {tokenError && (
              <div className={settingsStyles.tokenActions}>
                <p className={settingsStyles.tokenError}>{tokenError}</p>
                <Button type="button" size="sm" variant="ghost" loading={tokenLoading} onClick={() => void loadToken()}>
                  Thử lại
                </Button>
              </div>
            )}
            {token !== null && !tokenError && (
              <>
                <div className={settingsStyles.tokenFieldWrap}>
                  <input
                    className={[settingsStyles.tokenInput, tokenVisible ? '' : settingsStyles.tokenMasked].join(
                      ' ',
                    )}
                    readOnly
                    aria-label="Gateway token"
                    value={
                      tokenVisible ? token : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••'
                    }
                    spellCheck={false}
                  />
                </div>
                <div className={settingsStyles.tokenActions}>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    loading={tokenLoading}
                    disabled={tokenLoading || !token}
                    onClick={() => setTokenVisible((v) => !v)}
                  >
                    {tokenVisible ? (
                      <>
                        <EyeOff size={14} strokeWidth={1.75} aria-hidden style={{ marginRight: 6 }} />
                        Ẩn token
                      </>
                    ) : (
                      <>
                        <Eye size={14} strokeWidth={1.75} aria-hidden style={{ marginRight: 6 }} />
                        Hiện token
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={!token}
                    onClick={() => void handleCopy()}
                  >
                    {copyDone ? 'Đã copy' : 'Copy'}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" loading={tokenLoading} onClick={() => void loadToken()}>
                    Tải lại
                  </Button>
                </div>
              </>
            )}
          </div>
        </section>

        <section className={detailStyles.panel}>
          <h2 className={detailStyles.panelTitle}>Thông tin dự án</h2>
          <div className={detailStyles.dl}>
            <div className={detailStyles.row}>
              <span className={detailStyles.dt}>Subdomain</span>
              <span className={detailStyles.dd}>{p.subdomain}</span>
            </div>
            <div className={detailStyles.row}>
              <span className={detailStyles.dt}>URL công khai</span>
              <span className={detailStyles.dd}>
                {p.publicUrl ?? `https://${p.subdomain}.${publicHost}`}
              </span>
            </div>
            <div className={detailStyles.row}>
              <span className={detailStyles.dt}>Tạo lúc</span>
              <span className={detailStyles.dd}>{formatWhen(p.createdAt)}</span>
            </div>
            <div className={detailStyles.row}>
              <span className={detailStyles.dt}>Hoạt động gần nhất</span>
              <span className={detailStyles.dd}>{formatWhen(health?.lastActiveAt ?? p.lastActiveAt)}</span>
            </div>
            {typeof health?.storageUsedMb === 'number' && (
              <div className={detailStyles.row}>
                <span className={detailStyles.dt}>Dung lượng (ước tính)</span>
                <span className={detailStyles.dd}>{Math.round(health.storageUsedMb)} MB</span>
              </div>
            )}
            {p.containerName && (
              <div className={detailStyles.row}>
                <span className={detailStyles.dt}>Container</span>
                <span className={detailStyles.dd}>{p.containerName}</span>
              </div>
            )}
          </div>
          {healthError && <p className={detailStyles.error}>{healthError}</p>}
          <div className={detailStyles.refreshWrap}>
            <Button type="button" size="sm" variant="ghost" onClick={() => void loadHealth()}>
              Cập nhật thông tin
            </Button>
          </div>
        </section>

        <section className={[detailStyles.panel, detailStyles.danger].join(' ')}>
          <h2 className={detailStyles.panelTitle}>Khu vực nguy hiểm</h2>
          <p className={detailStyles.dangerNote}>
            Xóa project chỉ thực hiện được khi container đang dừng hoặc lỗi. Mọi dữ liệu trong project sẽ bị
            gỡ.
          </p>
          <Button
            type="button"
            size="sm"
            variant="danger"
            loading={isDestroying}
            onClick={handleDestroy}
            disabled={isBusy}
          >
            Xóa project
          </Button>
        </section>
      </div>

      {showDeleteModal && (
        <div className={detailStyles.modalOverlay}>
          <div className={detailStyles.modalContent}>
            <div className={detailStyles.modalHeader}>
              <h3 className={detailStyles.modalTitle}>Xác nhận xóa project</h3>
            </div>
            <div className={detailStyles.modalBody}>
              <p>Bạn có chắc chắn muốn xóa vĩnh viễn project <strong>{displayName}</strong> không? Toàn bộ dữ liệu của project này sẽ bị mất và không thể khôi phục.</p>
            </div>
            <div className={detailStyles.modalFooter}>
              <Button type="button" variant="ghost" onClick={() => setShowDeleteModal(false)}>
                Hủy
              </Button>
              <Button
                type="button"
                variant="primary"
                style={{ background: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                onClick={() => void confirmDestroy()}
              >
                Xóa
              </Button>
            </div>
          </div>
        </div>
      )}

      {alertMessage && (
        <div className={detailStyles.modalOverlay}>
          <div className={detailStyles.modalContent}>
            <div className={detailStyles.modalHeader}>
              <h3 className={detailStyles.modalTitle}>Thông báo</h3>
            </div>
            <div className={detailStyles.modalBody}>
              <p>{alertMessage}</p>
            </div>
            <div className={detailStyles.modalFooter}>
              <Button type="button" variant="primary" onClick={() => setAlertMessage(null)}>
                Đã hiểu
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
