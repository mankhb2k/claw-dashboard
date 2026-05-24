'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import styles from './Box.module.css'

type SpacingValue = number | string

const resolveSpacing = (val: SpacingValue | undefined) => {
  if (val === undefined) return undefined;
  if (typeof val === 'number') {
    return `${val}px`;
  }
  return val; // string
}

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

export interface BoxProps extends React.HTMLAttributes<HTMLElement> {
  // Spacing
  p?: SpacingValue
  px?: SpacingValue
  py?: SpacingValue
  pt?: SpacingValue
  pb?: SpacingValue
  pl?: SpacingValue
  pr?: SpacingValue

  // Sizing
  width?: string | number
  height?: string | number
  fullWidth?: boolean
  fullHeight?: boolean

  // Style
  border?: boolean
  radius?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  color?: ColorVariant | (string & {})

  asChild?: boolean
  as?: React.ElementType
}

export const Box = React.forwardRef<HTMLElement, BoxProps>(
  (
    {
      p,
      px,
      py,
      pt,
      pb,
      pl,
      pr,
      width,
      height,
      fullWidth,
      fullHeight,
      border,
      radius,
      color,
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
      styles.box,
      fullWidth ? styles['full-width'] : '',
      fullHeight ? styles['full-height'] : '',
      border ? styles.border : '',
      radius ? styles[`radius-${radius}`] : '',
      isPredefinedColor ? styles[`color-${color}`] : '',
      className || '',
    ]
      .filter(Boolean)
      .join(' ')

    const combinedStyle: React.CSSProperties = {
      width,
      height,
      backgroundColor: color && !isPredefinedColor ? color : undefined,
      ...style,
    }

    if (p !== undefined) combinedStyle.padding = resolveSpacing(p)
    if (pt !== undefined || py !== undefined) combinedStyle.paddingTop = resolveSpacing(pt) ?? resolveSpacing(py)
    if (pb !== undefined || py !== undefined) combinedStyle.paddingBottom = resolveSpacing(pb) ?? resolveSpacing(py)
    if (pl !== undefined || px !== undefined) combinedStyle.paddingLeft = resolveSpacing(pl) ?? resolveSpacing(px)
    if (pr !== undefined || px !== undefined) combinedStyle.paddingRight = resolveSpacing(pr) ?? resolveSpacing(px)

    return (
      <Comp ref={ref} className={classes} style={combinedStyle} {...props}>
        {children}
      </Comp>
    )
  }
)

Box.displayName = 'Box'
