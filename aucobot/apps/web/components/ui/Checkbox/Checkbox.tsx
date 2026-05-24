import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import styles from './Checkbox.module.css'

export interface CheckboxProps extends CheckboxPrimitive.CheckboxProps {
  label?: string
}

export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ label, id, className, ...props }, ref) => {
    return (
      <div className={styles.wrapper}>
        <CheckboxPrimitive.Root
          ref={ref}
          id={id}
          className={`${styles.root} ${className || ''}`}
          {...props}
        >
          <CheckboxPrimitive.Indicator className={styles.indicator}>
            <Check className={styles.icon} />
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
        {label && (
          <label htmlFor={id} className={styles.label}>
            {label}
          </label>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'
