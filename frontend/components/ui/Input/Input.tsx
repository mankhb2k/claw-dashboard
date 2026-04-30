import { forwardRef } from 'react'
import * as Label from '@radix-ui/react-label'
import styles from './Input.module.css'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, id, className, ...props },
  ref
) {
  const describedBy = error && id ? `${id}-error` : undefined

  return (
    <div className={styles.field}>
      {label && (
        <Label.Root className={styles.label} htmlFor={id}>
          {label}
        </Label.Root>
      )}
      <input
        ref={ref}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={[styles.input, error ? styles.inputError : '', className ?? ''].join(' ')}
        {...props}
      />
      {error && (
        <span id={describedBy} className={styles.error}>
          {error}
        </span>
      )}
    </div>
  )
})
