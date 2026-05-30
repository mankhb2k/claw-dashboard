import { forwardRef } from 'react'
import styles from './Textarea.module.css'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: React.ReactNode
  /** Stretch field + textarea to fill remaining flex space in parent */
  fill?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, fill = false, id, className, ...props }, ref) => {
    return (
      <div className={`${styles.field} ${fill ? styles.fieldFill : ''}`}>
        {label ? (
          <label className={styles.label} htmlFor={id}>
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={id}
          className={`${styles.textarea} ${fill ? styles.textareaFill : ''} ${error ? styles.textareaError : ''} ${className || ''}`}
          aria-invalid={error ? true : undefined}
          {...props}
        />
        {error ? <span className={styles.error}>{error}</span> : null}
        {!error && hint ? <div className={styles.hint}>{hint}</div> : null}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
