'use client'

import {
  useLayoutEffect,
  useMemo,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'

import {
  flattenSlashMenuSections,
  resolveSlashMenuPosition,
} from './slash-menu.utils'
import styles from './SlashMenu.module.css'

export type SlashMenuItem = {
  id: string
  label: string
  description?: string
}

export type SlashMenuSection = {
  id: string
  title: string
  items: SlashMenuItem[]
  emptyMessage?: string
  loading?: boolean
}

export type SlashMenuProps = {
  open: boolean
  anchorRef: RefObject<HTMLElement | null>
  sections: SlashMenuSection[]
  activeIndex?: number
  id?: string
  ariaLabel?: string
  onSelect: (sectionId: string, item: SlashMenuItem) => void
  onActiveChange?: (flatIndex: number) => void
}

export function SlashMenu({
  open,
  anchorRef,
  sections,
  activeIndex = 0,
  id = 'chat-slash-menu',
  ariaLabel = 'Slash commands',
  onSelect,
  onActiveChange,
}: SlashMenuProps) {
  const [mounted, setMounted] = useState(false)
  const [position, setPosition] = useState<CSSProperties>({})

  const flatEntries = useMemo(
    () => flattenSlashMenuSections(sections),
    [sections],
  )

  const activeEntry = flatEntries[activeIndex] ?? null

  useLayoutEffect(() => {
    // SSR: defer portal until after mount to avoid document/window mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- §9.11
    setMounted(true)
  }, [])

  useLayoutEffect(() => {
    if (!open) return undefined

    const updatePosition = () => {
      const anchor = anchorRef.current
      if (!anchor) return

      const next = resolveSlashMenuPosition(anchor)
      setPosition({
        position: 'fixed',
        left: next.left,
        width: next.width,
        bottom: next.bottom,
        maxHeight: next.maxHeight,
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, anchorRef, sections])

  if (!mounted || !open) return null

  return createPortal(
    <div
      id={id}
      className={styles.content}
      style={position}
      role="listbox"
      aria-label={ariaLabel}
    >
      <div className={styles.viewport}>
        {sections.map((section) => (
          <div key={section.id} className={styles.section}>
            <div className={styles.header}>{section.title}</div>
            {section.loading ? (
              <p className={styles.empty}>{section.emptyMessage}</p>
            ) : section.items.length === 0 ? (
              <p className={styles.empty}>{section.emptyMessage}</p>
            ) : (
              section.items.map((item) => {
                const isActive =
                  activeEntry?.sectionId === section.id &&
                  activeEntry.item.id === item.id

                return (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
                    onMouseEnter={() => {
                      const flatIndex = flatEntries.findIndex(
                        (entry) =>
                          entry.sectionId === section.id &&
                          entry.item.id === item.id,
                      )
                      if (flatIndex >= 0) onActiveChange?.(flatIndex)
                    }}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onSelect(section.id, item)}
                  >
                    <span className={styles.label}>{item.label}</span>
                    {item.description ? (
                      <span className={styles.description}>
                        {item.description}
                      </span>
                    ) : null}
                  </button>
                )
              })
            )}
          </div>
        ))}
      </div>
    </div>,
    document.body,
  )
}
