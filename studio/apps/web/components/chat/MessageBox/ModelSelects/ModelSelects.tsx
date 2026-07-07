'use client'

import styles from './ModelSelects.module.css'
import { Select } from '@/components/ui'
import { useI18n } from '@/lib/i18n'

export type ModelSelectOption = {
  value: string
  label: string
}

export type ModelSelectsProps = {
  composerId: string
  providerId?: string
  providerOptions: ModelSelectOption[]
  onProviderChange: (providerId: string) => void
  modelId?: string
  modelOptions: ModelSelectOption[]
  onModelChange: (modelId: string) => void
  modelsLoading?: boolean
  selectsDisabled?: boolean
}

export function ModelSelects({
  composerId,
  providerId,
  providerOptions,
  onProviderChange,
  modelId,
  modelOptions,
  onModelChange,
  modelsLoading = false,
  selectsDisabled = false,
}: ModelSelectsProps) {
  const { t } = useI18n()

  const providerPlaceholder = modelsLoading
    ? t('chat.composer.loading')
    : providerOptions.length === 0
      ? t('chat.composer.noApiKey')
      : t('chat.composer.provider')

  const modelPlaceholder = modelsLoading
    ? t('chat.composer.loading')
    : t('chat.composer.model')

  return (
    <div className={styles.modelSelects}>
      <div className={styles.select}>
        <Select
          id={`${composerId}-provider`}
          labelPosition="none"
          size="sm"
          value={providerId || undefined}
          onValueChange={onProviderChange}
          options={providerOptions}
          disabled={selectsDisabled}
          placeholder={providerPlaceholder}
        />
      </div>
      <div className={styles.select}>
        <Select
          id={`${composerId}-model`}
          labelPosition="none"
          size="sm"
          value={modelId || undefined}
          onValueChange={onModelChange}
          options={modelOptions}
          disabled={
            selectsDisabled || modelOptions.length === 0 || !providerId
          }
          placeholder={modelPlaceholder}
        />
      </div>
    </div>
  )
}
