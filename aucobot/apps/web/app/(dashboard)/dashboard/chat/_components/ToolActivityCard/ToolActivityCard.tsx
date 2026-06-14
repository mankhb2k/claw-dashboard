'use client'

import { useState } from 'react'
import {
  AlertCircle,
  Check,
  ChevronDown,
  FileText,
  Loader2,
  Terminal,
  Wrench,
} from 'lucide-react'

import { useI18n } from '@/lib/i18n'
import type { ToolStreamEntry } from '@/utils/chat/tool-stream.types'

import styles from './ToolActivityCard.module.css'

type ToolActivityCardProps = {
  entry: ToolStreamEntry
}

function ToolIcon({ entry }: { entry: ToolStreamEntry }) {
  const className = styles.headerIcon
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

function statusLabel(
  status: ToolStreamEntry['status'],
  t: (key: string) => string,
): string {
  if (status === 'running') return t('chat.toolActivity.ui.running')
  if (status === 'error') return t('chat.toolActivity.ui.failed')
  return t('chat.toolActivity.ui.completed')
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

  return (
    <article className={styles.card} data-status={entry.status}>
      <button
        type="button"
        className={styles.header}
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className={styles.headerMain}>
          <span className={styles.headerIconWrap}>
            {entry.status === 'running' ? (
              <Loader2 className={styles.headerSpinner} />
            ) : entry.status === 'error' ? (
              <AlertCircle className={styles.headerErrorIcon} />
            ) : (
              <Check className={styles.headerDoneIcon} />
            )}
            <ToolIcon entry={entry} />
          </span>
          <span className={styles.headerText}>
            <span className={styles.title}>{label}</span>
            {!expanded && preview ? (
              <span className={styles.summary}>{preview.split('\n')[0]}</span>
            ) : null}
          </span>
        </span>
        <span className={styles.headerMeta}>
          <span className={styles.badge} data-status={entry.status}>
            {statusLabel(entry.status, t)}
          </span>
          <ChevronDown
            className={`${styles.chevron}${expanded ? ` ${styles.chevronOpen}` : ''}`}
            aria-hidden
          />
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
