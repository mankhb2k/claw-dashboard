import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import styles from './ButtonGroup.module.css'

interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean
}

export function ButtonGroup({ children, className, asChild = false, ...props }: ButtonGroupProps) {
  const Comp = asChild ? Slot : 'div'

  return (
    <Comp className={`${styles.group} ${className || ''}`} {...props}>
      {children}
    </Comp>
  )
}
