'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useProjectStore } from '@/stores/project.store'
import { extractProjectIdFromSegment } from '@/lib/project-route'
import { Header } from '@/components/layout/Header/Header'
import { Button } from '@/components/ui/Button/Button'
import { useI18n } from '@/lib/i18n'
import styles from './connect.module.css'
import { MOCK_SERVICES, type ServiceMeta } from './mock-data'
import { ConnectSplitActions } from './components/ConnectSplitActions'
import { ConnectorAppStoreModal } from './components/ConnectorAppStoreModal'
import { CustomConnectorModal } from './components/CustomConnectorModal'
import { ConnectorDetailModal } from './components/ConnectorDetailModal'

export default function ProjectConnectPage() {
  const { t } = useI18n()
  const router = useRouter()
  const params = useParams()
  const projectSegment = typeof params.projectSlug === 'string' ? params.projectSlug : ''
  const id = useMemo(() => extractProjectIdFromSegment(projectSegment), [projectSegment])

  const project = useProjectStore((s) => s.projects.find((p) => p.id === id))
  const fetchProjects = useProjectStore((s) => s.fetchProjects)
  const [fetched, setFetched] = useState(false)

  const [connections, setConnections] = useState<Record<string, boolean>>({
    drive: true,
    notion: true,
  })
  const [appStoreOpen, setAppStoreOpen] = useState(false)
  const [customModalOpen, setCustomModalOpen] = useState(false)
  const [detailModalService, setDetailModalService] = useState<ServiceMeta | null>(null)

  useEffect(() => {
    if (!id) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when project changes
    setFetched(false)
    void fetchProjects().finally(() => setFetched(true))
  }, [id, fetchProjects])

  const handleConnect = (serviceId: string) => {
    setConnections((prev) => ({ ...prev, [serviceId]: true }))
  }

  const handleDisconnect = (serviceId: string) => {
    setConnections((prev) => ({ ...prev, [serviceId]: false }))
  }

  const visibleServices = useMemo(
    () => MOCK_SERVICES.filter((svc) => Boolean(connections[svc.id])),
    [connections],
  )

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

  const displayName = project?.displayName ?? project?.name ?? 'Project'

  return (
    <>
      <Header title={t('connect.page.titleWithProject', { name: displayName })} />

      <div className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.intro}>
            <h1 className={styles.title}>{t('connect.page.hubTitle')}</h1>
            <p className={styles.lead}>{t('connect.page.lead')}</p>
          </div>

          <div className={styles.toolbar}>
            <Button
              variant="primary"
              size="md"
              className={styles.addConnectorBtn}
              onClick={() => setAppStoreOpen(true)}
            >
              {t('connect.page.addConnector')}
            </Button>
            <Button
              variant="primary"
              size="md"
              className={styles.addConnectorBtn}
              onClick={() => setCustomModalOpen(true)}
            >
              {t('connect.page.addCustomConnector')}
            </Button>
          </div>
          <div className={styles.list}>
            {visibleServices.length > 0 ? (
              visibleServices.map((svc) => {
                const isConnected = Boolean(connections[svc.id])
                const label = t(`connect.services.${svc.slug}.name`)
                const desc = t(`connect.services.${svc.slug}.description`)
                return (
                  <div key={svc.id} className={styles.listItem} role="group" aria-label={label}>
                    <div className={styles.itemMain}>
                      <div className={styles.cardIconWrap} style={{ fontWeight: 'bold', fontSize: '14px' }} aria-hidden>
                        {label.slice(0, 2).toUpperCase()}
                      </div>
                      <div className={styles.itemContent}>
                        <div className={styles.itemTop}>
                          <h3 className={styles.cardTitle}>{label}</h3>
                          <span className={styles.cardBadge}>{svc.type}</span>
                        </div>
                        <p className={styles.cardDesc}>{desc}</p>
                      </div>
                    </div>
                    <div className={styles.itemActions}>
                      {isConnected && (
                        <ConnectSplitActions
                          onViewDetails={() => {
                            router.push(`/project/${projectSegment}/connect/${svc.slug}`)
                          }}
                          onRefreshTools={() => {
                            // Mock-only UI: keep action visible as in Claude menu.
                          }}
                          onDisconnect={() => handleDisconnect(svc.id)}
                          onRemove={() => handleDisconnect(svc.id)}
                          configureLabel={t('connect.menu.configure')}
                          actionsAria={t('connect.menu.moreOptionsAria', { name: label })}
                          viewDetailsLabel={t('connect.menu.viewDetails')}
                          refreshToolsLabel={t('connect.menu.refreshToolsList')}
                          disconnectLabel={t('connect.menu.disconnect')}
                          removeLabel={t('connect.menu.remove')}
                        />
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className={styles.empty}>{t('connect.page.emptyServices')}</div>
            )}
          </div>
        </div>
      </div>
      {appStoreOpen && (
        <ConnectorAppStoreModal
          services={MOCK_SERVICES}
          connections={connections}
          t={t}
          onClose={() => setAppStoreOpen(false)}
          onConnect={handleConnect}
          onOpenDetails={(service) => setDetailModalService(service)}
        />
      )}
      {customModalOpen && (
        <CustomConnectorModal t={t} onClose={() => setCustomModalOpen(false)} />
      )}
      {detailModalService && (
        <ConnectorDetailModal
          service={detailModalService}
          t={t}
          onClose={() => setDetailModalService(null)}
          onDisconnect={(serviceId) => {
            handleDisconnect(serviceId)
            setDetailModalService(null)
          }}
        />
      )}
    </>
  )
}
