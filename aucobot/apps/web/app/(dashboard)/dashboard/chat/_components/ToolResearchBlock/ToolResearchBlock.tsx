'use client'

import { useMemo, useState } from 'react'
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  FileText,
  Globe,
  Link2,
  Loader2,
  Terminal,
  Wrench,
} from 'lucide-react'

import { useI18n } from '@/lib/i18n'
import type { ToolStep, ToolStreamEntry } from '@/utils/chat/tool/types'

import styles from './ToolResearchBlock.module.css'

type ToolResearchBlockProps = {
  entries: ToolStreamEntry[]
}

function StepIcon({ icon }: { icon?: ToolStep['icon'] }) {
  const className = styles.stepIcon
  switch (icon) {
    case 'globe':
      return <Globe className={className} />
    case 'link':
      return <Link2 className={className} />
    case 'terminal':
      return <Terminal className={className} />
    case 'file':
      return <FileText className={className} />
    default:
      return <Wrench className={className} />
  }
}

function faviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`
}

function resolveStepLabel(
  entry: ToolStreamEntry,
  step: ToolStep,
  t: (key: string, vars?: Record<string, string>) => string,
): string {
  if (entry.canonicalId === 'web_search' && step.icon === 'globe') {
    const query =
      typeof entry.args?.query === 'string'
        ? entry.args.query
        : typeof entry.args?.q === 'string'
          ? entry.args.q
          : step.label
    return t('chat.toolActivity.steps.searchingFor', { query })
  }
  if (entry.canonicalId === 'web_fetch' && step.icon === 'link') {
    return t('chat.toolActivity.steps.reading', { domain: step.label })
  }
  return step.label
}

export function ToolResearchBlock({ entries }: ToolResearchBlockProps) {
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(true)

  const { steps, sources, headerLabel, isRunning, hasError } = useMemo(() => {
    const allSteps: Array<{ entry: ToolStreamEntry; step: ToolStep }> = []
    const allSources = new Map<string, { url: string; domain: string; title?: string }>()
    let running = false
    let error = false
    let header = t('chat.toolActivity.ui.research')

    for (const entry of entries) {
      if (entry.status === 'running') running = true
      if (entry.status === 'error') error = true
      if (entry.status === 'running') {
        header = t(entry.i18nKey)
      }
      for (const step of entry.steps ?? []) {
        allSteps.push({ entry, step })
      }
      for (const source of entry.sources ?? []) {
        allSources.set(source.url, source)
      }
    }

    return {
      steps: allSteps,
      sources: [...allSources.values()],
      headerLabel: header,
      isRunning: running,
      hasError: error,
    }
  }, [entries, t])

  if (entries.length === 0) return null

  const Chevron = expanded ? ChevronDown : ChevronRight

  return (
    <div
      className={styles.block}
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
          {isRunning ? (
            <Loader2 className={styles.headerSpinner} aria-hidden />
          ) : null}
          <span className={styles.headerLabel}>{headerLabel}</span>
          <Chevron className={styles.chevron} aria-hidden />
        </span>
      </button>

      <div className={`${styles.body}${expanded ? ` ${styles.bodyOpen}` : ''}`}>
        <ul className={styles.steps}>
          {steps.map(({ entry, step }) => (
            <li key={step.id} className={styles.step} data-status={step.status}>
              <span className={styles.stepLeading} aria-hidden>
                {step.status === 'running' ? (
                  <Loader2 className={styles.stepSpinner} />
                ) : step.status === 'error' ? (
                  <AlertCircle className={styles.stepError} />
                ) : (
                  <StepIcon icon={step.icon} />
                )}
              </span>
              <span className={styles.stepLabel}>
                {resolveStepLabel(entry, step, t)}
              </span>
            </li>
          ))}
        </ul>

        {sources.length > 0 && (
          <div className={styles.sources}>
            <span className={styles.sourcesTitle}>
              {t('chat.toolActivity.ui.sources')}
            </span>
            <div className={styles.sourcePills}>
              {sources.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.sourcePill}
                  title={source.title ?? source.url}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- remote favicon from arbitrary source domains; next/image would require remotePatterns config + fixed dimensions for a tiny decorative icon */}
                  <img
                    src={faviconUrl(source.domain)}
                    alt=""
                    className={styles.sourceFavicon}
                    loading="lazy"
                  />
                  <span>{source.domain}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
