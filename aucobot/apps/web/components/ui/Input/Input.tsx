import { forwardRef } from 'react'
import styles from './Input.module.css'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className, ...props }, ref) => {
    return (
      <div className={styles.field}>
        {label && (
          <label className={styles.label} htmlFor={id}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`${styles.input} ${error ? styles.inputError : ''} ${className || ''}`}
          suppressHydrationWarning
          {...props}
        />
        {error && <span className={styles.error}>{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'
