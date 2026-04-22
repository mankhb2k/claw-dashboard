import styles from './Button.module.css'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
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
    </button>
  )
}
