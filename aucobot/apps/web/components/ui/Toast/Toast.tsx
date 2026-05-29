'use client'

import * as React from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { CircleAlert, CircleCheck } from 'lucide-react'
import styles from './Toast.module.css'

const TOAST_DURATION_MS = 3000

export type ToastVariant = 'success' | 'error'

export interface ToastOptions {
  variant: ToastVariant
  title: string
  description?: string
  duration?: number
}

interface ToastItem extends ToastOptions {
  id: string
}

export interface ToastContextValue {
  toast: (options: ToastOptions) => string
  success: (title: string, description?: string) => string
  error: (title: string, description?: string) => string
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

let toastCounter = 0
let toastDispatcher: ToastContextValue | null = null

function registerToastDispatcher(value: ToastContextValue | null) {
  toastDispatcher = value
}

/** Call toast outside components — wrap app with ToastProvider */
export const toast: ToastContextValue = {
  toast: (options) => {
    if (!toastDispatcher) {
      console.warn('[Toast] ToastProvider is not mounted.')
      return ''
    }
    return toastDispatcher.toast(options)
  },
  success: (title, description) => toast.toast({ variant: 'success', title, description }),
  error: (title, description) => toast.toast({ variant: 'error', title, description }),
}

export function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider.')
  }
  return context
}

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = React.useState<ToastItem[]>([])

  const removeToast = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const addToast = React.useCallback((options: ToastOptions) => {
    const id = `toast-${++toastCounter}`
    setItems((prev) => [...prev, { id, duration: TOAST_DURATION_MS, ...options }])
    return id
  }, [])

  const api = React.useMemo<ToastContextValue>(
    () => ({
      toast: addToast,
      success: (title, description) =>
        addToast({ variant: 'success', title, description }),
      error: (title, description) =>
        addToast({ variant: 'error', title, description }),
    }),
    [addToast],
  )

  React.useEffect(() => {
    registerToastDispatcher(api)
    return () => registerToastDispatcher(null)
  }, [api])

  return (
    <ToastContext.Provider value={api}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {items.map((item) => (
          <ToastRoot
            key={item.id}
            variant={item.variant}
            title={item.title}
            description={item.description}
            duration={item.duration}
            onDismiss={() => removeToast(item.id)}
          />
        ))}
        <ToastViewport />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}

interface ToastRootProps {
  variant: ToastVariant
  title: string
  description?: string
  duration?: number
  onDismiss: () => void
}

function ToastRoot({
  variant,
  title,
  description,
  duration = TOAST_DURATION_MS,
  onDismiss,
}: ToastRootProps) {
  const Icon = variant === 'success' ? CircleCheck : CircleAlert

  return (
    <ToastPrimitive.Root
      className={`${styles.root} ${styles[variant]}`}
      duration={duration}
      defaultOpen
      onOpenChange={(open) => {
        if (!open) onDismiss()
      }}
    >
      <div className={styles.content}>
        <Icon className={styles.icon} size={20} aria-hidden />
        <div className={styles.text}>
          <ToastPrimitive.Title className={styles.title}>{title}</ToastPrimitive.Title>
          {description ? (
            <ToastPrimitive.Description className={styles.description}>
              {description}
            </ToastPrimitive.Description>
          ) : null}
        </div>
      </div>
    </ToastPrimitive.Root>
  )
}

export const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={`${styles.viewport} ${className ?? ''}`}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitive.Viewport.displayName
