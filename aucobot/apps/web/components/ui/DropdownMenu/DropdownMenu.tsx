import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { ChevronRight } from 'lucide-react'
import styles from './DropdownMenu.module.css'

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
    /** Độ rộng tối thiểu của menu (số = px, chuỗi = CSS length). */
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

export const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  DropdownMenuPrimitive.DropdownMenuItemProps & { variant?: 'default' | 'danger' }
>(({ className, variant = 'default', ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={`${styles.item} ${variant === 'danger' ? styles.danger : ''} ${className || ''}`}
    {...props}
  />
))
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

export const DropdownMenuSub = DropdownMenuPrimitive.Sub

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

export type DropdownMenuItemExtendProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.SubTrigger
> & {
  /** Giá trị phụ hiển thị trước icon mở rộng (vd. "Light"). */
  detail?: React.ReactNode
}

export const DropdownMenuItemExtend = React.forwardRef<
  HTMLDivElement,
  DropdownMenuItemExtendProps
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
DropdownMenuItemExtend.displayName = 'DropdownMenuItemExtend'
