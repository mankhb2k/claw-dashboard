'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronDown, ChevronLeft, ExternalLink } from 'lucide-react'
import { Header } from '@/components/layout/Header/Header'
import { useI18n } from '@/lib/i18n'
import { useProjectStore } from '@/stores/project.store'
import { extractProjectIdFromSegment } from '@/lib/project-route'
import {
  MOCK_PERMISSION_GROUPS,
  type PermissionMode,
  findServiceBySlug,
} from '../mock-data'
import styles from '../connect.module.css'

export default function ProjectConnectorDetailPage() {
  const { t } = useI18n()
  const params = useParams()
  const projectSegment =
    typeof params.projectSlug === 'string' ? params.projectSlug : ''
  const connectorSlug =
    typeof params.connectorSlug === 'string' ? params.connectorSlug : ''
  const id = useMemo(
    () => extractProjectIdFromSegment(projectSegment),
    [projectSegment],
  )
  const service = useMemo(() => findServiceBySlug(connectorSlug), [connectorSlug])

  const project = useProjectStore((s) => s.projects.find((p) => p.id === id))
  const fetchProjects = useProjectStore((s) => s.fetchProjects)
  const [fetched, setFetched] = useState(false)

  const [groupExpanded, setGroupExpanded] = useState<Record<string, boolean>>({
    read: true,
    write: true,
  })
  const [groupMode, setGroupMode] = useState<Record<string, PermissionMode>>({
    read: 'ask',
    write: 'ask',
  })
  const [toolMode, setToolMode] = useState<Record<string, PermissionMode>>({})

  useEffect(() => {
    if (!id) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when project changes
    setFetched(false)
    void fetchProjects().finally(() => setFetched(true))
  }, [id, fetchProjects])

  const applyModeForGroup = (groupId: string, mode: PermissionMode) => {
    const group = MOCK_PERMISSION_GROUPS.find((item) => item.id === groupId)
    if (!group) return
    setGroupMode((prev) => ({ ...prev, [groupId]: mode }))
    setToolMode((prev) => {
      const next = { ...prev }
      group.tools.forEach((tool) => {
        next[tool] = mode
      })
      return next
    })
  }

  if (!id || (fetched && !project)) {
    return (
      <>
        <Header title={t('connect.page.headerConnect')} />
        <div className={styles.page}>
          <div className={styles.shell}>
            <p className={styles.error}>{t('connect.page.projectNotFound')}</p>
          </div>
        </div>
      </>
    )
  }

  if (!project && !fetched) {
    return (
      <>
        <Header title={t('connect.page.headerConnect')} />
        <div className={styles.page}>
          <div className={styles.state}>
            <span className={styles.spinner} />
            <p>{t('connect.page.loading')}</p>
          </div>
        </div>
      </>
    )
  }

  if (!service) {
    return (
      <>
        <Header title={t('connect.detail.connectorNotFoundTitle')} />
        <div className={styles.page}>
          <div className={styles.shell}>
            <p className={styles.error}>{t('connect.detail.connectorNotFound')}</p>
            <Link href={`/project/${projectSegment}/connect`} className={styles.backBtn}>
              <ChevronLeft size={16} /> {t('connect.detail.backAllConnectors')}
            </Link>
          </div>
        </div>
      </>
    )
  }

  const displayName = project?.displayName ?? project?.name ?? 'Project'

  return (
    <>
      <Header
        title={t('connect.page.titleWithProject', {
          name: displayName,
        })}
      />
      <div className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.connectorDetail}>
            <nav>
              <Link href={`/project/${projectSegment}/connect`} className={styles.backBtn}>
                <ChevronLeft size={16} /> {t('connect.detail.backAllConnectors')}
              </Link>
            </nav>

            <header className={styles.detailHeader}>
              <div className={styles.detailTitleWrap}>
                <div className={styles.detailIcon}>
                  {t(`connect.services.${service.slug}.name`)
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <h1 className={styles.detailTitle}>
                  {t(`connect.services.${service.slug}.name`)}
                </h1>
              </div>
              <div className={styles.detailActions}>
                <a
                  href={service.supportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.iconAction}
                  aria-label={t('connect.detail.supportAria')}
                >
                  <ExternalLink size={18} />
                </a>
                <button type="button" className={styles.uninstallBtn}>
                  {t('connect.detail.uninstall')}
                </button>
              </div>
            </header>

            <section className={styles.permissionSection}>
              <div className={styles.permissionHead}>
                <h3 className={styles.permissionTitle}>
                  {t('connect.detail.toolPermissions')}
                </h3>
                <p className={styles.permissionLead}>
                  {t('connect.detail.toolPermissionsLead')}
                </p>
              </div>

              <div className={styles.permissionList}>
                {MOCK_PERMISSION_GROUPS.map((group) => {
                  const expanded = groupExpanded[group.id] ?? true
                  return (
                    <div key={group.id} className={styles.groupBlock}>
                      <div className={styles.groupHead}>
                        <button
                          type="button"
                          className={styles.groupToggle}
                          aria-expanded={expanded}
                          onClick={() =>
                            setGroupExpanded((prev) => ({
                              ...prev,
                              [group.id]: !expanded,
                            }))
                          }
                        >
                          <ChevronDown
                            size={14}
                            className={
                              expanded
                                ? styles.chevronOpen
                                : styles.chevronClosed
                            }
                          />
                          <span>{t(`connect.groups.${group.labelKey}`)}</span>
                          <span className={styles.groupCount}>
                            {group.tools.length}
                          </span>
                        </button>
                        <div className={styles.segmented}>
                          {(['allow', 'ask', 'block'] as PermissionMode[]).map(
                            (mode) => (
                              <button
                                key={mode}
                                type="button"
                                className={styles.segmentBtn}
                                data-active={
                                  groupMode[group.id] === mode || undefined
                                }
                                onClick={() => applyModeForGroup(group.id, mode)}
                              >
                                {mode === 'allow'
                                  ? t('connect.detail.alwaysAllow')
                                  : mode === 'ask'
                                    ? t('connect.detail.needsApproval')
                                    : t('connect.detail.blocked')}
                              </button>
                            ),
                          )}
                        </div>
                      </div>

                      {expanded && (
                        <div className={styles.groupTools}>
                          {group.tools.map((tool) => (
                            <div key={tool} className={styles.toolRow}>
                              <span className={styles.toolName}>{tool}</span>
                              <div className={styles.segmented}>
                                {(['allow', 'ask', 'block'] as PermissionMode[]).map(
                                  (mode) => (
                                    <button
                                      key={mode}
                                      type="button"
                                      className={styles.segmentBtn}
                                      data-active={
                                        (toolMode[tool] ?? groupMode[group.id]) ===
                                          mode || undefined
                                      }
                                      onClick={() =>
                                        setToolMode((prev) => ({
                                          ...prev,
                                          [tool]: mode,
                                        }))
                                      }
                                    >
                                      {mode === 'allow'
                                        ? t('connect.detail.allow')
                                        : mode === 'ask'
                                          ? t('connect.detail.ask')
                                          : t('connect.detail.block')}
                                    </button>
                                  ),
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}
