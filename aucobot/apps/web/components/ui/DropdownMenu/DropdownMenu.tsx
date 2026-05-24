import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
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

export const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  DropdownMenuPrimitive.DropdownMenuContentProps
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={`${styles.content} ${className || ''}`}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
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
