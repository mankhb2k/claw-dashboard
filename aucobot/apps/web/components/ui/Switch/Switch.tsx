import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import styles from './Switch.module.css'

export interface SwitchProps extends SwitchPrimitive.SwitchProps {
  label?: string
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ label, id, className, ...props }, ref) => {
    return (
      <div className={styles.wrapper}>
        <SwitchPrimitive.Root
          ref={ref}
          id={id}
          className={`${styles.root} ${className || ''}`}
          {...props}
        >
          <SwitchPrimitive.Thumb className={styles.thumb} />
        </SwitchPrimitive.Root>
        {label && (
          <label htmlFor={id} className={styles.label}>
            {label}
          </label>
        )}
      </div>
    )
  }
)

Switch.displayName = 'Switch'
