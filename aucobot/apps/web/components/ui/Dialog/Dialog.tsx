import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import * as React from 'react'

import styles from './Dialog.module.css'
import { Button } from '../Button/Button'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogPortal = DialogPrimitive.Portal
export const DialogClose = DialogPrimitive.Close

export const DialogOverlay = React.forwardRef<
  HTMLDivElement,
  DialogPrimitive.DialogOverlayProps
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={`${styles.overlay} ${className || ''}`}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

export const DialogContent = React.forwardRef<
  HTMLDivElement,
  DialogPrimitive.DialogContentProps & { showClose?: boolean }
>(({ className, children, showClose = true, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogOverlay />
    <div className={styles.container}>
      <DialogPrimitive.Content
        ref={ref}
        className={`${styles.content} ${className || ''}`}
        {...props}
      >
        {children}
        {showClose && (
          <DialogPrimitive.Close asChild>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              className={styles.closeBtn}
              aria-label="Close"
            >
              <X size={18} />
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </div>
  </DialogPrimitive.Portal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

export const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`${styles.header} ${className || ''}`} {...props} />
)
DialogHeader.displayName = 'DialogHeader'

export const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`${styles.footer} ${className || ''}`} {...props} />
)
DialogFooter.displayName = 'DialogFooter'

export const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  DialogPrimitive.DialogTitleProps
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={`${styles.title} ${className || ''}`}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

export const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  DialogPrimitive.DialogDescriptionProps
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={`${styles.description} ${className || ''}`}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName
