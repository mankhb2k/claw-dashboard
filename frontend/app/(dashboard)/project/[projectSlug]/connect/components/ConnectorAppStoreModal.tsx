'use client'

import { useMemo, useState } from 'react'
import { Plus, Settings, X } from 'lucide-react'
import { Button } from '@/components/ui/Button/Button'
import type { ServiceMeta } from '../mock-data'
import styles from './ConnectorAppStoreModal.module.css'

type Props = {
  services: ServiceMeta[]
  connections: Record<string, boolean>
  t: (key: string) => string
  onClose: () => void
  onConnect: (serviceId: string) => void
  onOpenDetails: (service: ServiceMeta) => void
}

export function ConnectorAppStoreModal({
  services,
  connections,
  t,
  onClose,
  onConnect,
  onOpenDetails,
}: Props) {
  const [query, setQuery] = useState('')

  const visibleServices = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return services
    return services.filter((svc) => {
      const label = t(`connect.services.${svc.slug}.name`).toLowerCase()
      const desc = t(`connect.services.${svc.slug}.description`).toLowerCase()
      return label.includes(keyword) || desc.includes(keyword)
    })
  }, [query, services, t])

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={t('connect.store.title')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{t('connect.store.title')}</h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={styles.closeBtn}
            aria-label={t('connect.store.closeAria')}
            onClick={onClose}
          >
            <X size={18} aria-hidden />
          </Button>
        </div>

        <div className={styles.searchWrap}>
          <input
            type="text"
            className={styles.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('connect.store.searchPlaceholder')}
            aria-label={t('connect.store.searchPlaceholder')}
          />
        </div>

        <div className={styles.list}>
          {visibleServices.map((svc) => {
            const label = t(`connect.services.${svc.slug}.name`)
            const desc = t(`connect.services.${svc.slug}.description`)
            const isConnected = Boolean(connections[svc.id])
            return (
              <div key={svc.id} className={styles.card}>
                <div className={styles.cardMain}>
                  <div className={styles.cardIcon} aria-hidden>
                    {label.slice(0, 2).toUpperCase()}
                  </div>
                  <div className={styles.cardMeta}>
                    <h3 className={styles.cardTitle}>{label}</h3>
                    <p className={styles.cardDesc}>{desc}</p>
                  </div>
                </div>
                {isConnected ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={styles.iconBtn}
                    aria-label={t('connect.store.openSettingsAria')}
                    onClick={() => onOpenDetails(svc)}
                  >
                    <Settings size={16} />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={styles.iconBtn}
                    aria-label={t('connect.store.installAria')}
                    onClick={() => onConnect(svc.id)}
                  >
                    <Plus size={16} />
                  </Button>
                )}
              </div>
            )
          })}
          {visibleServices.length === 0 && (
            <div className={styles.empty}>{t('connect.store.empty')}</div>
          )}
        </div>
      </div>
    </div>
  )
}

