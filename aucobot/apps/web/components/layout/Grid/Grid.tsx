'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import styles from './Grid.module.css'

type SpacingValue = 0 | 1 | 2 | 3 | 4 | 6 | 8

const PREDEFINED_COLORS = [
  'white',
  'subtle',
  'surface',
  'primary-dim',
  'danger-dim',
  'success-dim',
  'primary',
  'success',
  'warning',
  'danger',
] as const

type ColorVariant = (typeof PREDEFINED_COLORS)[number]

const resolveGap = (val: string | number | undefined) => {
  if (val === undefined) return undefined;
  if (typeof val === 'number') {
    return `${val}px`;
  }
  return val; // string
}

export interface GridProps extends React.HTMLAttributes<HTMLElement> {
  // Grid properties
  columns?: string | number
  gap?: string | number
  gapX?: string | number
  gapY?: string | number
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'stretch'
  
  // Style properties
  color?: ColorVariant | (string & {})
  border?: boolean
  radius?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  
  // Spacing properties
  p?: SpacingValue
  px?: SpacingValue
  py?: SpacingValue
  
  // Utilities
  inline?: boolean
  fullWidth?: boolean
  fullHeight?: boolean
  
  asChild?: boolean
  as?: React.ElementType
}

export const Grid = React.forwardRef<HTMLElement, GridProps>(
  (
    {
      columns = 1,
      gap,
      gapX,
      gapY,
      align,
      justify,
      color,
      border,
      radius,
      p,
      px,
      py,
      inline = false,
      fullWidth,
      fullHeight,
      asChild = false,
      as = 'div',
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : as

    const isPredefinedColor = color && PREDEFINED_COLORS.includes(color as ColorVariant)

    const classes = [
      inline ? styles.inline : styles.grid,
      align ? styles[`align-${align}`] : '',
      justify ? styles[`justify-${justify}`] : '',
      p !== undefined ? styles[`p-${p}`] : '',
      px !== undefined ? styles[`px-${px}`] : '',
      py !== undefined ? styles[`py-${py}`] : '',
      border ? styles.border : '',
      radius ? styles[`radius-${radius}`] : '',
      isPredefinedColor ? styles[`color-${color}`] : '',
      fullWidth ? styles['full-width'] : '',
      fullHeight ? styles['full-height'] : '',
      className || '',
    ]
      .filter(Boolean)
      .join(' ')

    const combinedStyle: React.CSSProperties = {
      backgroundColor: color && !isPredefinedColor ? color : undefined,
      gridTemplateColumns: typeof columns === 'number' ? `repeat(${columns}, minmax(0, 1fr))` : columns,
      rowGap: resolveGap(gapY) ?? resolveGap(gap),
      columnGap: resolveGap(gapX) ?? resolveGap(gap),
      ...style,
    }

    return (
      <Comp ref={ref} className={classes} style={combinedStyle} {...props}>
        {children}
      </Comp>
    )
  }
)

Grid.displayName = 'Grid'
