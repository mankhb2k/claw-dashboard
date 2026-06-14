'use client'

import { useI18n } from '@/lib/i18n'
import { TitleHeader } from '../TitleHeader/TitleHeader'

interface I18nTitleHeaderProps {
  titleKey: string
  descriptionKey?: string
  showBorder?: boolean
}

export function I18nTitleHeader({
  titleKey,
  descriptionKey,
  showBorder,
}: I18nTitleHeaderProps) {
  const { t } = useI18n()

  return (
    <TitleHeader
      title={t(titleKey)}
      description={descriptionKey ? t(descriptionKey) : undefined}
      showBorder={showBorder}
    />
  )
}
