'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Ellipsis, Eye, EyeOff, Edit2, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Header } from '@/components/layout/Header/Header'
import { Button } from '@/components/ui/Button/Button'
import { Input } from '@/components/ui/Input/Input'
import { projectApi } from '@/lib/api/project'
import { extractProjectIdFromSegment } from '@/lib/project-route'
import { useProjectStore } from '@/stores/project.store'
import {
  agentProviderKeysFormSchema,
  PROJECT_AGENT_ENV_KEYS,
  type AgentProviderKeysFormInput,
} from '@/schemas/project.schema'
import styles from './model.module.css'

type KeyTab = 'all' | 'configured'

type EnvMaskRow = { masked: string; updatedAt: string }

const FIELD_META: Record<
  keyof AgentProviderKeysFormInput,
  { label: string; hint: string; placeholder: string }
> = {
  OPENAI_API_KEY: {
    label: 'OpenAI (ChatGPT)',
    hint: 'sk-…',
    placeholder: 'sk-…',
  },
  ANTHROPIC_API_KEY: {
    label: 'Anthropic (Claude)',
    hint: 'sk-ant-…',
    placeholder: 'sk-ant-…',
  },
  GEMINI_API_KEY: {
    label: 'Google Gemini',
    hint: 'AIza…',
    placeholder: 'AIza…',
  },
  OPENROUTER_API_KEY: {
    label: 'OpenRouter',
    hint: 'sk-or-…',
    placeholder: 'sk-or-…',
  },
  GOOGLE_API_KEY: {
    label: 'Google API',
    hint: 'Dùng cho các API Google khác (nếu cần).',
    placeholder: 'API key…',
  },
}

const ENV_KEYS_ORDER: Array<keyof AgentProviderKeysFormInput> = [...PROJECT_AGENT_ENV_KEYS]

const DEFAULTS: AgentProviderKeysFormInput = {
  OPENAI_API_KEY: '',
  ANTHROPIC_API_KEY: '',
  GEMINI_API_KEY: '',
  OPENROUTER_API_KEY: '',
  GOOGLE_API_KEY: '',
}

function SecretKeyGlyph() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" aria-hidden>
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.21969 12.5303L4.75002 13.0607L5.81068 12L5.28035 11.4697L1.81068 7.99999L5.28035 4.53032L5.81068 3.99999L4.75002 2.93933L4.21969 3.46966L0.39647 7.29289C0.00594562 7.68341 0.00594562 8.31658 0.39647 8.7071L4.21969 12.5303ZM11.7804 12.5303L11.25 13.0607L10.1894 12L10.7197 11.4697L14.1894 7.99999L10.7197 4.53032L10.1894 3.99999L11.25 2.93933L11.7804 3.46966L15.6036 7.29289C15.9941 7.68341 15.9941 8.31658 15.6036 8.7071L11.7804 12.5303Z"
      />
    </svg>
  )
}

function formatSavedFooter(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })
  } catch {
    return ''
  }
}

function RowActionsMenu({
  onEdit,
  onDelete,
  deleteDisabled,
}: {
  onEdit: () => void
  onDelete: () => void
  deleteDisabled: boolean
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className={styles.menuWrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.kebabBtn}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Thao tác"
        onClick={() => setOpen((x) => !x)}
      >
        <Ellipsis size={20} strokeWidth={1.75} aria-hidden />
      </button>
      {open ? (
        <ul className={styles.dropdown} role="menu">
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className={styles.menuItem}
              onClick={() => {
                onEdit()
                setOpen(false)
              }}
            >
              <Edit2 size={14} /> Sửa
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className={[styles.menuItem, styles.menuItemDanger].join(' ')}
              disabled={deleteDisabled}
              onClick={() => {
                if (deleteDisabled) return
                onDelete()
                setOpen(false)
              }}
            >
              <Trash2 size={14} /> Xóa
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  )
}

export default function ProjectModelKeysPage() {
  const params = useParams()
  const projectSegment =
    typeof params.projectSlug === 'string' ? params.projectSlug : ''
  const id = useMemo(() => extractProjectIdFromSegment(projectSegment), [projectSegment])

  const project = useProjectStore((s) => s.projects.find((p) => p.id === id))
  const fetchProjects = useProjectStore((s) => s.fetchProjects)

  const [fetched, setFetched] = useState(false)
  const [envMetaByKey, setEnvMetaByKey] = useState<
    Partial<Record<keyof AgentProviderKeysFormInput, EnvMaskRow>>
  >({})
  const [loadEnvError, setLoadEnvError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [tab, setTab] = useState<KeyTab>('all')
  const [search, setSearch] = useState('')
  const [editingKey, setEditingKey] = useState<keyof AgentProviderKeysFormInput | null>(null)
  const [keyToDelete, setKeyToDelete] = useState<keyof AgentProviderKeysFormInput | null>(null)
  const [revealed, setRevealed] = useState<Partial<Record<keyof AgentProviderKeysFormInput, boolean>>>(
    {},
  )
  /** Key thật (chỉ trong phiên) sau khi lưu thành công — server chỉ trả masked. */
  const [plaintextSessionByKey, setPlaintextSessionByKey] = useState<
    Partial<Record<keyof AgentProviderKeysFormInput, string>>
  >({})

  const configuredKeySet = useMemo(() => {
    return new Set(
      Object.keys(envMetaByKey) as Array<keyof AgentProviderKeysFormInput>,
    )
  }, [envMetaByKey])

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<AgentProviderKeysFormInput>({
    defaultValues: DEFAULTS,
    shouldUnregister: false,
  })

  const refreshMaskedKeys = useCallback(async () => {
    if (!id) return
    setLoadEnvError(null)
    try {
      const rows = await projectApi.listEnv(id)
      const next: Partial<Record<keyof AgentProviderKeysFormInput, EnvMaskRow>> = {}
      for (const row of rows) {
        const k = row.key as keyof AgentProviderKeysFormInput
        if (k in FIELD_META) next[k] = { masked: row.masked, updatedAt: row.updatedAt }
      }
      setEnvMetaByKey(next)
    } catch (e) {
      setEnvMetaByKey({})
      setLoadEnvError(e instanceof Error ? e.message : 'Không tải được danh sách khóa')
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset loading when route project id changes
    setFetched(false)
    void fetchProjects().finally(() => setFetched(true))
  }, [id, fetchProjects])

  useEffect(() => {
    if (!id || !project) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- listEnv resolves asynchronously
    void refreshMaskedKeys()
  }, [id, project, refreshMaskedKeys])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- xóa key phiên khi đổi project, tránh lộ nhầm
    setPlaintextSessionByKey({})
    setRevealed({})
  }, [id])

  const visibleKeys = useMemo(() => {
    const q = search.trim().toLowerCase()
    return ENV_KEYS_ORDER.filter((key) => {
      const meta = FIELD_META[key]
      const matchesSearch =
        !q ||
        String(key).toLowerCase().includes(q) ||
        meta.label.toLowerCase().includes(q)
      const matchesTab = tab === 'all' || (tab === 'configured' && configuredKeySet.has(key))
      return matchesSearch && matchesTab
    })
  }, [configuredKeySet, search, tab])

  const toggleReveal = useCallback((k: keyof AgentProviderKeysFormInput) => {
    setRevealed((prev) => ({ ...prev, [k]: !prev[k] }))
  }, [])

  const removeKeyEnv = async (key: keyof AgentProviderKeysFormInput) => {
    if (!id) return
    clearErrors(key)
    setSaveSuccess(false)
    try {
      await projectApi.deleteEnvKey(id, key)
      resetField(key, { defaultValue: '' })
      setEditingKey(null)
      setRevealed((prev) => {
        const copy = { ...prev }
        delete copy[key]
        return copy
      })
      setPlaintextSessionByKey((prev) => {
        const copy = { ...prev }
        delete copy[key]
        return copy
      })
      await refreshMaskedKeys()
    } catch (e) {
      setError('root', { message: e instanceof Error ? e.message : 'Không xóa được khóa' })
    }
  }

  const onSubmit = async (data: AgentProviderKeysFormInput) => {
    if (!id) return
    clearErrors()
    setSaveSuccess(false)

    const parsed = agentProviderKeysFormSchema.safeParse(data)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      const path = String(first?.path?.[0] ?? '')
      if (path && path in FIELD_META) {
        setError(path as keyof AgentProviderKeysFormInput, { message: first.message })
      }
      setError('root', { message: 'Dữ liệu không hợp lệ.' })
      return
    }

    const env = PROJECT_AGENT_ENV_KEYS.map((key) => ({
      key,
      value: parsed.data[key].trim(),
    })).filter((e) => e.value.length > 0)

    if (env.length === 0) {
      setError('root', {
        message: 'Nhập ít nhất một API key (hoặc cập nhật một ô đã có trước khi gửi).',
      })
      return
    }

    try {
      await projectApi.upsertEnv(id, { env })
      setSaveSuccess(true)
      setEditingKey(null)
      setPlaintextSessionByKey((prev) => {
        const next = { ...prev }
        for (const e of env) {
          const k = e.key as keyof AgentProviderKeysFormInput
          if (k in FIELD_META) next[k] = e.value
        }
        return next
      })
      await refreshMaskedKeys()
    } catch (e) {
      setError('root', { message: e instanceof Error ? e.message : 'Lưu thất bại' })
    }
  }

  const hasAnyConfigured = configuredKeySet.size > 0

  const openEditRow = useCallback((key: keyof AgentProviderKeysFormInput) => {
    setEditingKey(key)
    requestAnimationFrame(() => document.getElementById(String(key))?.focus())
  }, [])

  if (!id) {
    return (
      <>
        <Header title="Model" />
        <div className={styles.page}>
          <div className={styles.shell}>
            <p className={styles.error}>Mã project không hợp lệ</p>
          </div>
        </div>
      </>
    )
  }

  if (!project && !fetched) {
    return (
      <>
        <Header title="Model & API keys" />
        <div className={styles.page}>
          <div className={styles.state}>
            <span className={styles.spinner} />
            <p>Đang tải...</p>
          </div>
        </div>
      </>
    )
  }

  if (fetched && !project) {
    return (
      <>
        <Header title="Không tìm thấy" />
        <div className={styles.page}>
          <div className={styles.shell}>
            <Link className={styles.back} href="/projects">
              ← Về danh sách
            </Link>
            <p className={styles.error}>Không tìm thấy project.</p>
          </div>
        </div>
      </>
    )
  }

  const displayName = project?.displayName ?? project?.name ?? 'Project'

  return (
    <>
      <Header title={`${displayName} · Model`} />

      <div className={styles.page}>
        <div className={styles.shell}>
          {loadEnvError ? (
            <p className={styles.bannerError} role="alert">
              {loadEnvError}
            </p>
          ) : null}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <fieldset
              id="model-provider-keys-fieldset"
              aria-labelledby="model-provider-keys-heading"
              className={styles.fieldset}
            >
            <div className={styles.stickyControls}>
            <div className={styles.headRow}>
              <div className={styles.headText}>
                <h2 id="model-provider-keys-heading" className={styles.title}>
                  Khóa API cho Model
                </h2>
                <p className={styles.description}>
                  Lưu API key cho các nhà cung cấp mô hình an toàn. Giá trị được mã hoá phía server; chỉ có thể cập nhật
                  bằng cách nhập key mới.
                </p>
              </div>
              <div className={styles.headActions}>
                <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang lưu…' : 'Lưu API keys'}
                </Button>
              </div>
            </div>

            <div className={styles.headActionsMobile}>
              <Button
                type="submit"
                variant="primary"
                size="md"
                className={styles.fullWidthBtn}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang lưu…' : 'Lưu API keys'}
              </Button>
            </div>

            <div className={styles.tabs} role="tablist" aria-label="Phạm vi hiển thị khóa">
              <button
                type="button"
                role="tab"
                className={styles.tab}
                id="model-keys-tab-all"
                aria-selected={tab === 'all'}
                data-active={tab === 'all' || undefined}
                aria-controls="model-keys-panel"
                onClick={() => setTab('all')}
              >
                Tất cả
              </button>
              <button
                type="button"
                role="tab"
                className={styles.tab}
                id="model-keys-tab-configured"
                aria-selected={tab === 'configured'}
                data-active={tab === 'configured' || undefined}
                aria-controls="model-keys-panel"
                onClick={() => setTab('configured')}
              >
                Đã cấu hình
              </button>
            </div>

            <div className={styles.toolbar}>
              <div className={styles.toolbarSearch}>
                <Input
                  id="model-keys-search"
                  type="search"
                  aria-label="Tìm nhà cung cấp hoặc biến môi trường"
                  placeholder="Tìm…"
                  value={search}
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.preventDefault()
                  }}
                />
              </div>
            </div>
            </div>

            <div id="model-keys-panel" role="tabpanel" aria-labelledby={`model-keys-tab-${tab}`}>
              {visibleKeys.length === 0 ? (
                <div className={styles.list}>
                  <p className={styles.empty}>
                    {tab === 'configured' && !hasAnyConfigured
                      ? 'Chưa có khóa nào được cấu hình.'
                      : 'Không có mục nào khớp tìm kiếm hoặc bộ lọc.'}
                  </p>
                </div>
              ) : (
                <div className={styles.list}>
                  {visibleKeys.map((key) => {
                    const meta = FIELD_META[key]
                    const maskRow = envMetaByKey[key]
                    const isConfigured = Boolean(maskRow)
                    const suffixId = `${String(key)}_hint`
                    const showMaskRow = isConfigured && editingKey !== key
                    const showEditor = editingKey === key || !isConfigured
                    const revealSource =
                      (plaintextSessionByKey[key]?.trim()
                        ? plaintextSessionByKey[key]
                        : maskRow?.masked) ?? ''

                    return (
                      <div key={key} className={styles.entityRow}>
                        <div className={styles.colKey}>
                          <div className={styles.rowIcon}>
                            <SecretKeyGlyph />
                          </div>
                          <div className={styles.keyStack}>
                            <span className={styles.rowKeyMono}>{key}</span>
                            <span className={styles.rowFriendly}>{meta.label}</span>
                            <span id={suffixId} className={styles.rowHint}>
                              {meta.hint}
                              {isConfigured ? ' · Giữ trên máy chủ (ẩn)' : ''}
                            </span>
                          </div>
                        </div>

                        <div className={styles.colValue}>
                          {showMaskRow ? (
                            <div className={styles.valueDisplay}>
                              <button
                                type="button"
                                className={styles.iconBtn}
                                aria-label={
                                  revealed[key]
                                    ? 'Ẩn key'
                                    : 'Hiển thị key (rút gọn … nếu dài)'
                                }
                                onClick={() => toggleReveal(key)}
                              >
                                {revealed[key] ? (
                                  <EyeOff size={17} strokeWidth={1.85} aria-hidden />
                                ) : (
                                  <Eye size={17} strokeWidth={1.85} aria-hidden />
                                )}
                              </button>
                              {revealed[key] ? (
                                <span className={styles.revealTextWrap}>
                                  <span
                                    className={styles.plainMask}
                                    title={
                                      revealSource.length > 0
                                        ? revealSource
                                        : undefined
                                    }
                                  >
                                    {revealSource.length > 0 ? revealSource : '—'}
                                  </span>
                                </span>
                              ) : (
                                <span className={styles.bullets} aria-hidden>
                                  ••••••••••••
                                </span>
                              )}
                            </div>
                          ) : null}

                          {showEditor ? (
                            <div className={styles.cellInput}>
                              <Input
                                id={String(key)}
                                type="password"
                                autoComplete="off"
                                spellCheck={false}
                                placeholder={meta.placeholder}
                                aria-describedby={suffixId}
                                error={errors[key]?.message}
                                {...register(key)}
                              />
                            </div>
                          ) : null}
                        </div>

                        <div className={styles.rowTail}>
                          <span className={styles.colMeta}>
                            {maskRow?.updatedAt
                              ? `Cập nhật ${formatSavedFooter(maskRow.updatedAt)}`
                              : 'Chưa cấu hình'}
                          </span>
                          <RowActionsMenu
                            onEdit={() => openEditRow(key)}
                            onDelete={() => setKeyToDelete(key)}
                            deleteDisabled={!isConfigured}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className={styles.footerMessages}>
              {errors.root ? (
                <p className={styles.rootError} role="alert">
                  {errors.root.message}
                </p>
              ) : null}
              {saveSuccess && !errors.root ? (
                <p className={styles.success} role="status">
                  Đã lưu API keys.
                </p>
              ) : null}
            </div>
            </fieldset>
          </form>
        </div>
      </div>

      {keyToDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Xác nhận xóa</h3>
            </div>
            <div className={styles.modalBody}>
              <p>Bạn có chắc chắn muốn xóa khóa API này? Hành động này không thể hoàn tác.</p>
            </div>
            <div className={styles.modalFooter}>
              <Button type="button" variant="ghost" onClick={() => setKeyToDelete(null)}>
                Hủy
              </Button>
              <Button
                type="button"
                variant="primary"
                style={{ background: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                onClick={() => {
                  void removeKeyEnv(keyToDelete)
                  setKeyToDelete(null)
                }}
              >
                Xóa
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
