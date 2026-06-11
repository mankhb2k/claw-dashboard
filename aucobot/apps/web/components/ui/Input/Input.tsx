import { forwardRef } from 'react'
import styles from './Input.module.css'

export type InputSize = 'sm' | 'md'
export type InputLabelPosition = 'top' | 'left' | 'right' | 'none'

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  /** Vị trí label: trên, trái, phải hoặc ẩn. Mặc định `top`. */
  labelPosition?: InputLabelPosition
  error?: string
  /** `md` giữ style hiện tại; `sm` dùng font nhỏ hơn và padding 4px. */
  size?: InputSize
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      labelPosition = 'top',
      error,
      id,
      className,
      style,
      size = 'md',
      ...props
    },
    ref,
  ) => {
    const showLabel = Boolean(label) && labelPosition !== 'none'
    const isHorizontalLabel =
      labelPosition === 'left' || labelPosition === 'right'

    const inputClass = [
      styles.input,
      size === 'sm' ? styles.inputSm : styles.inputMd,
      error ? styles.inputError : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ')

    const fieldClass = [
      styles.field,
      size === 'sm' ? styles.fieldSm : '',
    ]
      .filter(Boolean)
      .join(' ')

    const labelElement = showLabel ? (
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
    ) : null

    const inputElement = (
      <input
        ref={ref}
        id={id}
        className={inputClass}
        style={style}
        suppressHydrationWarning
        aria-invalid={!!error}
        {...props}
      />
    )

    const errorElement = error ? (
      <span className={styles.error}>{error}</span>
    ) : null

    return (
      <div className={fieldClass}>
        {labelPosition === 'top' && labelElement}

        {isHorizontalLabel ? (
          <>
            <div className={styles.fieldRow}>
              {labelPosition === 'left' && labelElement}
              <div className={styles.inputWrap}>{inputElement}</div>
              {labelPosition === 'right' && labelElement}
            </div>
            {errorElement}
          </>
        ) : (
          <div className={styles.control}>
            {inputElement}
            {errorElement}
          </div>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
