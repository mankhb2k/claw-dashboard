'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Header } from '@/components/layout/Header/Header'
import { Input } from '@/components/ui/Input/Input'
import { useI18n } from '@/lib/i18n'
import { openclawDocsUrl, type OpenClawChannel } from '@/lib/openclaw-channels'
import { extractProjectIdFromSegment } from '@/lib/project-route'
import { useProjectStore } from '@/stores/project.store'
import styles from './channel.module.css'

function getLocalChannelEnabled(projectId: string): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  try {
    const data = localStorage.getItem(`channel_${projectId}`)
    return data ? (JSON.parse(data) as Record<string, boolean>) : {}
  } catch {
    return {}
  }
}

function saveLocalChannelEnabled(projectId: string, enabledMap: Record<string, boolean>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(`channel_${projectId}`, JSON.stringify(enabledMap))
}

function ChannelCard({
  ch,
  enabled,
  onToggle,
}: {
  ch: OpenClawChannel
  enabled: boolean
  onToggle: (checked: boolean) => void
}) {
  const { t } = useI18n()
  const docsHref = openclawDocsUrl(ch.docsPath)
  const initial = ch.name.trim().charAt(0).toUpperCase() || '?'
  const badge =
    ch.kind === 'bundled'
      ? t('channels.badge.channel')
      : ch.kind === 'web'
        ? t('channels.badge.web')
        : t('channels.badge.plugin')

  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.iconWrap} aria-hidden>
          {initial}
        </div>
        <div className={styles.headText}>
          <h3 className={styles.cardTitle}>{ch.name}</h3>
          <span
            className={[
              styles.badge,
              ch.kind !== 'bundled' ? styles.badgeExternal : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {badge}
          </span>
        </div>
      </div>
      <p className={styles.desc}>{ch.description}</p>
      <div className={styles.cardFooter}>
        <div className={styles.footerMeta}>
          <div className={styles.statusText}>
            <div className={`${styles.statusDot} ${enabled ? styles.connected : ''}`} />
            {enabled ? 'Đã kết nối' : 'Ngắt kết nối'}
          </div>
          <div className={styles.vendorMeta}>
            <span className={styles.vendorDot} aria-hidden />
            <span className={styles.vendorName}>{ch.vendor}</span>
          </div>
        </div>
        <div className={styles.footerActions}>
          <a
            href={docsHref}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.docsLink}
            aria-label={t('channels.card.openDocsAria', { name: ch.name })}
          >
            {t('channels.page.docsLinkLabel')}
          </a>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onToggle(e.target.checked)}
              aria-label={`Bật tắt ${ch.name}`}
            />
            <span className={styles.slider} />
          </label>
        </div>
      </div>
    </article>
  )
}

export default function ProjectChannelsPage() {
  const { t, channels } = useI18n()
  const params = useParams()
  const projectSegment =
    typeof params.projectSlug === 'string' ? params.projectSlug : ''
  const id = useMemo(
    () => extractProjectIdFromSegment(projectSegment),
    [projectSegment],
  )

  const project = useProjectStore((s) => s.projects.find((p) => p.id === id))
  const fetchProjects = useProjectStore((s) => s.fetchProjects)

  const [fetched, setFetched] = useState(false)
  const [search, setSearch] = useState('')
  const [enabledChannels, setEnabledChannels] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!id) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when project id in URL changes
    setFetched(false)
    void fetchProjects().finally(() => setFetched(true))
    setEnabledChannels(getLocalChannelEnabled(id))
  }, [id, fetchProjects])

  const handleToggleChannel = (channelId: string, checked: boolean) => {
    if (!id) return
    const next = { ...enabledChannels, [channelId]: checked }
    setEnabledChannels(next)
    saveLocalChannelEnabled(id, next)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return channels
    return channels.filter((ch) => {
      const hay = `${ch.name} ${ch.description} ${ch.id}`.toLowerCase()
      return hay.includes(q)
    })
  }, [search, channels])

  if (!id) {
    return (
      <>
        <Header title={t('channels.page.headerChannel')} />
        <div className={styles.page}>
          <div className={styles.shell}>
            <p className={styles.error}>{t('channels.page.invalidProject')}</p>
          </div>
        </div>
      </>
    )
  }

  if (!project && !fetched) {
    return (
      <>
        <Header title={t('channels.page.headerChannel')} />
        <div className={styles.page}>
          <div className={styles.state}>
            <span className={styles.spinner} />
            <p>{t('channels.page.loading')}</p>
          </div>
        </div>
      </>
    )
  }

  if (fetched && !project) {
    return (
      <>
        <Header title={t('channels.page.notFoundTitle')} />
        <div className={styles.page}>
          <div className={styles.shell}>
            <Link className={styles.back} href="/projects">
              {t('channels.page.backToList')}
            </Link>
            <p className={styles.error}>{t('channels.page.projectNotFound')}</p>
          </div>
        </div>
      </>
    )
  }

  const displayName = project?.displayName ?? project?.name ?? 'Project'

  return (
    <>
      <Header title={t('channels.page.titleWithProject', { name: displayName })} />

      <div className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.controls}>
            <header className={styles.intro}>
              <h2 className={styles.title}>{t('channels.page.chatChannelsTitle')}</h2>
              <p className={styles.lead}>
                {t('channels.page.leadBeforeStrong')}
                <strong>{t('channels.page.leadStrong')}</strong>
                {t('channels.page.leadAfterStrong')}
                <a
                  className={styles.linkDocs}
                  href="https://docs.openclaw.ai/channels"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('channels.page.docsLinkLabel')}
                </a>
                .
              </p>
            </header>

            <div className={styles.toolbar}>
              <div className={styles.toolbarSearch}>
                <Input
                  id="channel-search"
                  type="search"
                  aria-label={t('channels.page.searchAria')}
                  placeholder={t('channels.page.searchPlaceholder')}
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

          <div className={styles.gridScroll}>
            {filtered.length === 0 ? (
              <p className={styles.empty}>{t('channels.page.emptySearch')}</p>
            ) : (
              <div className={styles.grid}>
                {filtered.map((ch) => (
                  <ChannelCard
                    key={ch.id}
                    ch={ch}
                    enabled={!!enabledChannels[ch.id]}
                    onToggle={(checked) => handleToggleChannel(ch.id, checked)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
