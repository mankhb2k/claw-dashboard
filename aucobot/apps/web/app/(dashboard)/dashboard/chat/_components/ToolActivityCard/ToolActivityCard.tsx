'use client'

import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  FileText,
  Loader2,
  Terminal,
  Wrench,
} from 'lucide-react'
import { useState } from 'react'

import styles from './ToolActivityCard.module.css'
import { useI18n } from '@/lib/i18n'

import type { ToolStreamEntry } from '@/utils/chat/tool/types'


type ToolActivityCardProps = {
  entry: ToolStreamEntry
}

function ToolIcon({ entry }: { entry: ToolStreamEntry }) {
  const className = styles.leadingIcon
  switch (entry.canonicalId) {
    case 'exec':
    case 'code_execution':
      return <Terminal className={className} />
    case 'read':
    case 'write':
    case 'edit':
    case 'apply_patch':
      return <FileText className={className} />
    default:
      return <Wrench className={className} />
  }
}

function HeaderLeading({ entry }: { entry: ToolStreamEntry }) {
  if (entry.status === 'running') {
    return <Loader2 className={styles.headerSpinner} aria-hidden />
  }
  if (entry.status === 'error') {
    return <AlertCircle className={styles.headerErrorIcon} aria-hidden />
  }
  return <ToolIcon entry={entry} />
}

export function ToolActivityCard({ entry }: ToolActivityCardProps) {
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(false)
  const [showFullOutput, setShowFullOutput] = useState(false)

  const label = entry.displayName
    ? t(entry.i18nKey, { name: entry.displayName })
    : t(entry.i18nKey)

  const preview = entry.outputPreview?.trim()
  const fullOutput = entry.outputFull?.trim()
  const displayOutput =
    showFullOutput && fullOutput ? fullOutput : preview || fullOutput

  const Chevron = expanded ? ChevronDown : ChevronRight
  const isRunning = entry.status === 'running'
  const hasError = entry.status === 'error'

  return (
    <article
      className={styles.card}
      data-running={isRunning ? 'true' : 'false'}
      data-error={hasError ? 'true' : 'false'}
    >
      <button
        type="button"
        className={styles.header}
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className={styles.headerMain}>
          <HeaderLeading entry={entry} />
          <span className={styles.title}>{label}</span>
          <Chevron className={styles.chevron} aria-hidden />
        </span>
      </button>

      <div className={`${styles.body}${expanded ? ` ${styles.bodyOpen}` : ''}`}>
        {entry.argsPreview ? (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              {t('chat.toolActivity.ui.args')}
            </div>
            <pre className={styles.mono}>{entry.argsPreview}</pre>
          </div>
        ) : null}

        {displayOutput ? (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              {t('chat.toolActivity.ui.output')}
            </div>
            <pre className={styles.mono}>{displayOutput}</pre>
            {entry.outputTruncated ? (
              <button
                type="button"
                className={styles.toggleOutput}
                onClick={() => setShowFullOutput((v) => !v)}
              >
                {showFullOutput
                  ? t('chat.toolActivity.ui.showLess')
                  : t('chat.toolActivity.ui.showMore')}
              </button>
            ) : null}
          </div>
        ) : null}

        {entry.errorMessage ? (
          <div className={styles.error}>{entry.errorMessage}</div>
        ) : null}
      </div>
    </article>
  )
}
