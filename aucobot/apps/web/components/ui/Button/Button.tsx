import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import styles from './Button.module.css'

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'secondary' | 'ghost' | 'danger' | 'link'
  size?: ButtonSize
  iconOnly?: boolean
  loading?: boolean
  asChild?: boolean
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  iconOnly = false,
  loading = false,
  asChild = false,
  fullWidth = false,
  disabled,
  children,
  className,
  style,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'

  const buttonClasses = [
    styles.btn,
    styles[`v_${variant}`],
    styles[`s_${size}`],
    iconOnly ? styles.iconOnly : '',
    fullWidth ? styles.fullWidth : '',
    loading ? styles.loading : '',
    className ?? '',
  ].join(' ')

  if (asChild) {
    return (
      <Comp
        className={buttonClasses}
        style={style}
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
      className={buttonClasses}
      style={style}
      disabled={disabled || loading}
      suppressHydrationWarning
      {...props}
    >
      {loading ? <span className={styles.spinner} /> : null}
      {children}
    </Comp>
  )
}
