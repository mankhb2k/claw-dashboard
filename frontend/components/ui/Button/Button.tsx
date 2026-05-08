import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import styles from './Button.module.css'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'secondary' | 'ghost' | 'danger' | 'link'
  size?: 'default' | 'xs' | 'sm' | 'lg' | 'icon' | 'icon_xs' | 'icon_sm' | 'icon_lg'
  loading?: boolean
  asChild?: boolean
}

export function Button({
  variant = 'primary',
  size = 'default',
  loading = false,
  asChild = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'

  const buttonClasses = [
    styles.btn,
    styles[`v_${variant}`],
    styles[`s_${size}`],
    loading ? styles.loading : '',
    className ?? '',
  ].join(' ')

  if (asChild) {
    return (
      <Comp
        className={buttonClasses}
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
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className={styles.spinner} /> : null}
      {children}
    </Comp>
  )
}
