'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Check, Loader2 } from 'lucide-react'

import { useI18n } from '@/lib/i18n'
import type { ToolActivity } from '@/utils/chat/tool/types'

import styles from './ToolActivityBar.module.css'

const DONE_AUTO_REMOVE_MS = 30_000

type ToolActivityBarProps = {
  activities: ToolActivity[]
  showPreparing?: boolean
}

function ActivityRow({
  label,
  status,
}: {
  label: string
  status: ToolActivity['status'] | 'preparing'
}) {
  return (
    <div className={styles.row} data-status={status} role="status" aria-live="polite">
      <span className={styles.icon} aria-hidden>
        {status === 'running' || status === 'preparing' ? (
          <Loader2 className={styles.spinner} />
        ) : status === 'done' ? (
          <Check />
        ) : (
          <AlertCircle />
        )}
      </span>
      <span className={styles.label}>{label}</span>
    </div>
  )
}

export function ToolActivityBar({
  activities,
  showPreparing = false,
}: ToolActivityBarProps) {
  const { t } = useI18n()
  const [hiddenDoneIds, setHiddenDoneIds] = useState<Set<string>>(
    () => new Set(),
  )
  const scheduledRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (activities.length === 0) {
      setHiddenDoneIds(new Set())
      scheduledRef.current.clear()
    }
  }, [activities.length])

  useEffect(() => {
    const timers: number[] = []
    for (const activity of activities) {
      if (activity.status !== 'done') continue
      if (hiddenDoneIds.has(activity.id)) continue
      if (scheduledRef.current.has(activity.id)) continue
      scheduledRef.current.add(activity.id)
      timers.push(
        window.setTimeout(() => {
          scheduledRef.current.delete(activity.id)
          setHiddenDoneIds((prev) => {
            if (prev.has(activity.id)) return prev
            const next = new Set(prev)
            next.add(activity.id)
            return next
          })
        }, DONE_AUTO_REMOVE_MS),
      )
    }
    return () => {
      for (const timer of timers) window.clearTimeout(timer)
    }
  }, [activities, hiddenDoneIds])

  const visibleActivities = activities.filter(
    (activity) => activity.status !== 'done' || !hiddenDoneIds.has(activity.id),
  )

  if (!showPreparing && visibleActivities.length === 0) {
    return null
  }

  return (
    <div className={styles.bar} aria-label="Tool activity">
      {visibleActivities.map((activity) => {
        const label = activity.displayName
          ? t(activity.i18nKey, { name: activity.displayName })
          : t(activity.i18nKey)
        return (
          <ActivityRow
            key={activity.id}
            status={activity.status}
            label={label}
          />
        )
      })}
      {showPreparing && visibleActivities.length === 0 && (
        <ActivityRow
          status="preparing"
          label={t('chat.toolActivity.preparing')}
        />
      )}
    </div>
  )
}
