import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import styles from './Button.module.css'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  loading?: boolean
  asChild?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  asChild = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'

  if (asChild) {
    return (
      <Comp
        className={[
          styles.btn,
          styles[variant],
          styles[size],
          loading ? styles.loading : '',
          className ?? '',
        ].join(' ')}
        data-disabled={disabled || loading ? '' : undefined}
        data-loading={loading ? '' : undefined}
        {...props}
      >
        {children}
      </Comp>
    )
  }

  return (
    <Comp
      className={[
        styles.btn,
        styles[variant],
        styles[size],
        loading ? styles.loading : '',
        className ?? '',
      ].join(' ')}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className={styles.spinner} /> : null}
      {children}
    </Comp>
  )
}
