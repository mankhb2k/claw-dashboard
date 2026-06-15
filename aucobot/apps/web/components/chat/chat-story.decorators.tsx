import type { Decorator } from '@storybook/react'
import React from 'react'

import { ContentArea } from '@/app/(dashboard)/dashboard/chat/_components/ContentArea/ContentArea'
import { I18nProvider } from '@/lib/i18n'

import styles from './chat-content-area-preview.module.css'

export const withChatI18n: Decorator = (Story) => (
  <I18nProvider defaultLocale="en">
    <div
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: 'var(--space-6)',
        background:
          'color-mix(in srgb, var(--color-muted) 48%, var(--color-background))',
        minHeight: 120,
      }}
    >
      <Story />
    </div>
  </I18nProvider>
)

/** ContentArea thread preview (no composer). */
export const withChatContentArea: Decorator = (Story) => (
  <I18nProvider defaultLocale="en">
    <div className={styles.frame}>
      <ContentArea autoScroll={false}>
        <Story />
      </ContentArea>
    </div>
  </I18nProvider>
)

export const withChatThread: Decorator = withChatContentArea
