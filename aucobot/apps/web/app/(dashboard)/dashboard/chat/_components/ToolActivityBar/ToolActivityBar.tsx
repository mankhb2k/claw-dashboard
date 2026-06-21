'use client'

import { AlertCircle, Check, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import styles from './ToolActivityBar.module.css'
import { useI18n } from '@/lib/i18n'

import type { ToolActivity } from '@/utils/chat/tool/types'


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

function DoneActivityScheduler({
  activityId,
  onHide,
}: {
  activityId: string
  onHide: (id: string) => void
}) {
  useEffect(() => {
    const timerId = window.setTimeout(() => {
      onHide(activityId)
    }, DONE_AUTO_REMOVE_MS)
    return () => window.clearTimeout(timerId)
  }, [activityId, onHide])

  return null
}

export function ToolActivityBar({
  activities,
  showPreparing = false,
}: ToolActivityBarProps) {
  const { t } = useI18n()
  const [hiddenDoneIds, setHiddenDoneIds] = useState<Set<string>>(
    () => new Set(),
  )
  const [trackedActivityCount, setTrackedActivityCount] = useState(
    activities.length,
  )

  if (activities.length === 0 && trackedActivityCount !== 0) {
    setTrackedActivityCount(0)
    setHiddenDoneIds(new Set())
  } else if (activities.length !== trackedActivityCount) {
    setTrackedActivityCount(activities.length)
  }

  const hideDoneActivity = useCallback((id: string) => {
    setHiddenDoneIds((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  const visibleActivities = activities.filter(
    (activity) => activity.status !== 'done' || !hiddenDoneIds.has(activity.id),
  )

  const doneActivitiesToSchedule = activities.filter(
    (activity) => activity.status === 'done' && !hiddenDoneIds.has(activity.id),
  )

  if (!showPreparing && visibleActivities.length === 0) {
    return null
  }

  return (
    <div className={styles.bar} aria-label="Tool activity">
      {doneActivitiesToSchedule.map((activity) => (
        <DoneActivityScheduler
          key={activity.id}
          activityId={activity.id}
          onHide={hideDoneActivity}
        />
      ))}
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
