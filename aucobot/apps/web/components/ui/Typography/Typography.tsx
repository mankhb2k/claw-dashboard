'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import styles from './Typography.module.css'

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'small' | 'xs'
  color?: 'default' | 'muted' | 'subtle' | 'primary'
  weight?: 'extralight' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold'
  italic?: boolean
  asChild?: boolean
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div' | 'label'
}

export const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ 
    variant = 'p', 
    color = 'default', 
    weight,
    italic = false,
    asChild = false, 
    as,
    className,
    style,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : (as || (['h1', 'h2', 'h3', 'h4'].includes(variant) ? variant : 'p')) as any
    const weightClass = weight ? styles[weight] : ''

    const classes = [
      styles.root,
      styles[variant],
      color !== 'default' ? styles[color] : '',
      weightClass,
      italic ? styles.italic : '',
      className || '',
    ].filter(Boolean).join(' ')

    return (
      <Comp
        ref={ref}
        className={classes}
        style={style}
        {...props}
      />
    )
  }
)

Typography.displayName = 'Typography'
