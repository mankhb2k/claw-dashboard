'use client'

import { ExternalLink, X } from 'lucide-react'
import { Button } from '@/components/ui/Button/Button'
import type { ServiceMeta } from '../mock-data'
import styles from './ConnectorDetailModal.module.css'

type Props = {
  service: ServiceMeta | null
  t: (key: string) => string
  onClose: () => void
  onDisconnect: (serviceId: string) => void
}

export function ConnectorDetailModal({ service, t, onClose, onDisconnect }: Props) {
  if (!service) return null

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={t('connect.detailModal.title')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{t(`connect.services.${service.slug}.name`)}</h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label={t('connect.detailModal.closeAria')}
          >
            <X size={18} aria-hidden />
          </Button>
        </div>

        <p className={styles.description}>{t(`connect.services.${service.slug}.description`)}</p>

        <p className={styles.sectionTitle}>{t('connect.detailModal.tools')}</p>
        <div className={styles.toolsWrap}>
          {service.tools.map((tool) => (
            <span key={tool} className={styles.toolChip}>
              {tool}
            </span>
          ))}
        </div>

        <div className={styles.metaGrid}>
          <p className={styles.metaLabel}>{t('connect.detailModal.author')}</p>
          <p className={styles.metaValue}>{service.author}</p>
          <p className={styles.metaLabel}>{t('connect.detailModal.connectorUrl')}</p>
          <p className={styles.metaValue}>{service.connectorUrl}</p>
        </div>

        <div className={styles.footer}>
          <a href={service.supportUrl} className={styles.linkBtn} target="_blank" rel="noreferrer noopener">
            {t('connect.detailModal.documentation')} <ExternalLink size={14} />
          </a>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={styles.disconnectBtn}
            onClick={() => onDisconnect(service.id)}
          >
            {t('connect.detailModal.disconnect')}
          </Button>
        </div>
      </div>
    </div>
  )
}

