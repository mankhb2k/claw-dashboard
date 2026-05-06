'use client'

import { useEffect, useRef, useState } from 'react'
import { Ellipsis } from 'lucide-react'
import { Button } from '@/components/ui/Button/Button'
import styles from './ConnectMenu.module.css'

type Props = {
  onViewDetails: () => void
  onRefreshTools: () => void
  onDisconnect: () => void
  onRemove: () => void
  actionsAria: string
  viewDetailsLabel: string
  refreshToolsLabel: string
  disconnectLabel: string
  removeLabel: string
}

export function ConnectMenu({
  onViewDetails,
  onRefreshTools,
  onDisconnect,
  onRemove,
  actionsAria,
  viewDetailsLabel,
  refreshToolsLabel,
  disconnectLabel,
  removeLabel,
}: Props) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className={styles.dropdownContainer} ref={wrapRef}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={styles.dropdownButton}
        aria-expanded={open}
        aria-label={actionsAria}
        onClick={() => setOpen((x) => !x)}
      >
        <Ellipsis size={20} strokeWidth={1.75} aria-hidden />
      </Button>
      {open && (
        <ul className={styles.dropdownMenu} role="menu">
          <li role="none">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              role="menuitem"
              className={styles.dropdownItem}
              onClick={() => {
                onViewDetails()
                setOpen(false)
              }}
            >
              {viewDetailsLabel}
            </Button>
          </li>
          <li role="none">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              role="menuitem"
              className={styles.dropdownItem}
              onClick={() => {
                onRefreshTools()
                setOpen(false)
              }}
            >
              {refreshToolsLabel}
            </Button>
          </li>
          <li role="none">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              role="menuitem"
              className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
              onClick={() => {
                onDisconnect()
                setOpen(false)
              }}
            >
              {disconnectLabel}
            </Button>
          </li>
          <li role="none">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              role="menuitem"
              className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
              onClick={() => {
                onRemove()
                setOpen(false)
              }}
            >
              {removeLabel}
            </Button>
          </li>
        </ul>
      )}
    </div>
  )
}

