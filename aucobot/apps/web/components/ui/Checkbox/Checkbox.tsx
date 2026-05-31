import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import styles from './Checkbox.module.css'

export interface CheckboxProps extends CheckboxPrimitive.CheckboxProps {
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ label, id, size = 'md', className, ...props }, ref) => {
    return (
      <div className={styles.wrapper} data-size={size}>
        <CheckboxPrimitive.Root
          ref={ref}
          id={id}
          className={`${styles.root} ${styles[`size_${size}`]} ${className || ''}`}
          {...props}
        >
          <CheckboxPrimitive.Indicator className={styles.indicator}>
            <Check className={styles.icon} aria-hidden />
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
        {label && (
          <label htmlFor={id} className={`${styles.label} ${styles[`label_${size}`]}`}>
            {label}
          </label>
        )}
      </div>
    )
  },
)

Checkbox.displayName = 'Checkbox'
