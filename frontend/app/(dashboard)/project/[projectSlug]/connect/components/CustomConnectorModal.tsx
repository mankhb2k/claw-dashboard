'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button/Button'
import styles from './CustomConnectorModal.module.css'

type Props = {
  t: (key: string) => string
  onClose: () => void
}

export function CustomConnectorModal({ t, onClose }: Props) {
  const [name, setName] = useState('')
  const [serverUrl, setServerUrl] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={t('connect.custom.title')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>
            {t('connect.custom.title')}
            <span className={styles.beta}>BETA</span>
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={styles.closeBtn}
            aria-label={t('connect.custom.closeAria')}
            onClick={onClose}
          >
            <X size={18} aria-hidden />
          </Button>
        </div>

        <p className={styles.lead}>{t('connect.custom.lead')}</p>

        <div className={styles.form}>
          <label className={styles.label} htmlFor="custom-connector-name">
            {t('connect.custom.nameLabel')}
          </label>
          <input
            id="custom-connector-name"
            type="text"
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="text"
            className={styles.input}
            placeholder={t('connect.custom.serverUrlPlaceholder')}
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
          />
          <p className={styles.advanced}>{t('connect.custom.advancedSettings')}</p>
          <input
            type="text"
            className={styles.input}
            placeholder={t('connect.custom.clientIdPlaceholder')}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          />
          <input
            type="password"
            className={styles.input}
            placeholder={t('connect.custom.clientSecretPlaceholder')}
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
          />
        </div>

        <p className={styles.hint}>{t('connect.custom.hint')}</p>

        <div className={styles.footer}>
          <Button type="button" variant="ghost" size="sm" className={styles.cancelBtn} onClick={onClose}>
            {t('connect.custom.cancel')}
          </Button>
          <Button type="button" variant="primary" size="sm" className={styles.addBtn}>
            {t('connect.custom.add')}
          </Button>
        </div>
      </div>
    </div>
  )
}

