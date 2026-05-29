'use client'

import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Check, ChevronRight } from 'lucide-react'
import styles from './DropdownMenu.module.css'

const DropdownMenuSubSelectContext = React.createContext(false)

function useDropdownMenuSubSelect() {
  return React.useContext(DropdownMenuSubSelectContext)
}

export const DropdownMenu = DropdownMenuPrimitive.Root

export const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuPrimitive.DropdownMenuTriggerProps & { 
    variant?: 'default' | 'kebab' | 'unstyled'
    children?: React.ReactNode
  }
>(({ className, variant = 'default', children, ...props }, ref) => (
  <DropdownMenuPrimitive.Trigger
    ref={ref}
    className={`${variant === 'kebab' ? styles.kebabTrigger : variant === 'default' ? styles.defaultTrigger : ''} ${className || ''}`}
    {...props}
  >
    {children}
  </DropdownMenuPrimitive.Trigger>
))
DropdownMenuTrigger.displayName = DropdownMenuPrimitive.Trigger.displayName

export type DropdownMenuContentProps =
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> & {
    /** Minimum menu width (number = px, string = CSS length). */
    width?: number | string
  }

export const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  DropdownMenuContentProps
>(({ className, sideOffset = 4, width, style, ...props }, ref) => {
  const widthStyle =
    width !== undefined
      ? { minWidth: typeof width === 'number' ? `${width}px` : width }
      : undefined

  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={`${styles.content} ${className || ''}`}
        style={{ ...widthStyle, ...style }}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
})
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

export type DropdownMenuItemProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Item
> & {
  variant?: 'default' | 'danger'
  /** Show checkmark when selected (use inside `DropdownMenuSub select`). */
  selected?: boolean
}

export const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ className, variant = 'default', selected, asChild, children, ...props }, ref) => {
    const subSelect = useDropdownMenuSubSelect()
    const isSelectable = subSelect && selected !== undefined && !asChild

    return (
      <DropdownMenuPrimitive.Item
        ref={ref}
        asChild={asChild}
        className={`${styles.item} ${isSelectable ? styles.itemSelectable : ''} ${variant === 'danger' ? styles.danger : ''} ${className || ''}`}
        aria-checked={isSelectable ? selected : undefined}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {children}
            {isSelectable && selected ? (
              <span className={styles.itemIndicator} aria-hidden>
                <Check size={14} />
              </span>
            ) : null}
          </>
        )}
      </DropdownMenuPrimitive.Item>
    )
  },
)
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

export const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  DropdownMenuPrimitive.DropdownMenuLabelProps
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={`${styles.label} ${className || ''}`}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

export const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  DropdownMenuPrimitive.DropdownMenuSeparatorProps
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={`${styles.separator} ${className || ''}`}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

export type DropdownMenuSubProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Sub
> & {
  /** Single-select submenu — child items use `selected` for checkmark. Default: false. */
  select?: boolean
}

export function DropdownMenuSub({ select = false, children, ...props }: DropdownMenuSubProps) {
  return (
    <DropdownMenuSubSelectContext.Provider value={select}>
      <DropdownMenuPrimitive.Sub {...props}>{children}</DropdownMenuPrimitive.Sub>
    </DropdownMenuSubSelectContext.Provider>
  )
}

export type DropdownMenuSubContentProps =
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent> & {
    width?: number | string
  }

export const DropdownMenuSubContent = React.forwardRef<
  HTMLDivElement,
  DropdownMenuSubContentProps
>(({ className, sideOffset = 4, width, style, ...props }, ref) => {
  const widthStyle =
    width !== undefined
      ? { minWidth: typeof width === 'number' ? `${width}px` : width }
      : undefined

  return (
    <DropdownMenuPrimitive.SubContent
      ref={ref}
      sideOffset={sideOffset}
      className={`${styles.content} ${className || ''}`}
      style={{ ...widthStyle, ...style }}
      {...props}
    />
  )
})
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName

export type DropdownMenuSubItemProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.SubTrigger
> & {
  /** Secondary label before chevron (e.g. "Light"). */
  detail?: React.ReactNode
}

export const DropdownMenuSubItem = React.forwardRef<
  HTMLDivElement,
  DropdownMenuSubItemProps
>(({ className, children, detail, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={`${styles.item} ${styles.itemExtend} ${className || ''}`}
    {...props}
  >
    <span className={styles.itemExtendMain}>{children}</span>
    {detail != null && detail !== '' ? (
      <span className={styles.itemExtendDetail}>{detail}</span>
    ) : null}
    <ChevronRight size={14} className={styles.itemExtendChevron} aria-hidden />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubItem.displayName = 'DropdownMenuSubItem'
