import * as React from 'react'
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import styles from './AlertDialog.module.css'
import { Button } from '../Button/Button'

export const AlertDialog = AlertDialogPrimitive.Root
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger

export const AlertDialogOverlay = React.forwardRef<
  HTMLDivElement,
  AlertDialogPrimitive.AlertDialogOverlayProps
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    ref={ref}
    className={`${styles.overlay} ${className || ''}`}
    {...props}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

export const AlertDialogContent = React.forwardRef<
  HTMLDivElement,
  AlertDialogPrimitive.AlertDialogContentProps
>(({ className, children, ...props }, ref) => (
  <AlertDialogPrimitive.Portal>
    <AlertDialogOverlay />
    <div className={styles.container}>
      <AlertDialogPrimitive.Content
        ref={ref}
        className={`${styles.content} ${className || ''}`}
        {...props}
      >
        {children}
      </AlertDialogPrimitive.Content>
    </div>
  </AlertDialogPrimitive.Portal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

export const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`${styles.header} ${className || ''}`} {...props} />
)

export const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`${styles.footer} ${className || ''}`} {...props} />
)

export const AlertDialogTitle = React.forwardRef<
  HTMLHeadingElement,
  AlertDialogPrimitive.AlertDialogTitleProps
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={`${styles.title} ${className || ''}`}
    {...props}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

export const AlertDialogDescription = React.forwardRef<
  HTMLParagraphElement,
  AlertDialogPrimitive.AlertDialogDescriptionProps
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={`${styles.description} ${className || ''}`}
    {...props}
  />
))
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName

export const AlertDialogAction = React.forwardRef<
  HTMLButtonElement,
  AlertDialogPrimitive.AlertDialogActionProps & { variant?: 'primary' | 'ghost' | 'danger' | 'outline' }
>(({ className, variant = 'primary', ...props }, ref) => (
  <AlertDialogPrimitive.Action ref={ref} asChild>
    <Button variant={variant} className={className} {...props} />
  </AlertDialogPrimitive.Action>
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

export const AlertDialogCancel = React.forwardRef<
  HTMLButtonElement,
  AlertDialogPrimitive.AlertDialogCancelProps & { variant?: 'primary' | 'ghost' | 'danger' | 'outline' }
>(({ className, variant = 'ghost', ...props }, ref) => (
  <AlertDialogPrimitive.Cancel ref={ref} asChild>
    <Button variant={variant} className={className} {...props} />
  </AlertDialogPrimitive.Cancel>
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName
