'use client'

import { Button } from '@/components/ui/Button/Button'
import { ConnectMenu } from './ConnectMenu'
import styles from './ConnectSplitActions.module.css'

type Props = {
  onViewDetails: () => void
  onRefreshTools: () => void
  onDisconnect: () => void
  onRemove: () => void
  configureLabel: string
  actionsAria: string
  viewDetailsLabel: string
  refreshToolsLabel: string
  disconnectLabel: string
  removeLabel: string
}

export function ConnectSplitActions({
  onViewDetails,
  onRefreshTools,
  onDisconnect,
  onRemove,
  configureLabel,
  actionsAria,
  viewDetailsLabel,
  refreshToolsLabel,
  disconnectLabel,
  removeLabel,
}: Props) {
  return (
    <div className={styles.splitActions} role="group" aria-label={actionsAria}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={styles.configureBtn}
        onClick={onViewDetails}
      >
        {configureLabel}
      </Button>
      <div className={styles.splitDivider} />
      <ConnectMenu
        onViewDetails={onViewDetails}
        onRefreshTools={onRefreshTools}
        onDisconnect={onDisconnect}
        onRemove={onRemove}
        actionsAria={actionsAria}
        viewDetailsLabel={viewDetailsLabel}
        refreshToolsLabel={refreshToolsLabel}
        disconnectLabel={disconnectLabel}
        removeLabel={removeLabel}
      />
    </div>
  )
}

