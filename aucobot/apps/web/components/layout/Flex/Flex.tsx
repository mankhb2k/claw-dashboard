'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import styles from './Flex.module.css'

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

export interface FlexProps extends React.HTMLAttributes<HTMLElement> {
  // Flex properties
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  gap?: SpacingValue
  gapX?: SpacingValue
  gapY?: SpacingValue
  
  // Style properties (Consistent with Box)
  color?: ColorVariant | (string & {})
  border?: boolean
  radius?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  
  // Spacing properties
  p?: SpacingValue
  px?: SpacingValue
  py?: SpacingValue
  
  // Utilities
  inline?: boolean
  center?: boolean
  fullWidth?: boolean
  fullHeight?: boolean
  
  asChild?: boolean
  as?: React.ElementType
}

export const Flex = React.forwardRef<HTMLElement, FlexProps>(
  (
    {
      direction = 'row',
      align,
      justify,
      wrap,
      gap,
      gapX,
      gapY,
      color,
      border,
      radius,
      p,
      px,
      py,
      inline = false,
      center = false,
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
      inline ? styles.inline : styles.flex,
      styles[`direction-${direction}`],
      align ? styles[`align-${align}`] : '',
      justify ? styles[`justify-${justify}`] : '',
      wrap ? styles[`wrap-${wrap}`] : '',
      border ? styles.border : '',
      radius ? styles[`radius-${radius}`] : '',
      isPredefinedColor ? styles[`color-${color}`] : '',
      center ? styles.center : '',
      fullWidth ? styles['full-width'] : '',
      fullHeight ? styles['full-height'] : '',
      className || '',
    ]
      .filter(Boolean)
      .join(' ')

    const combinedStyle: React.CSSProperties = {
      backgroundColor: color && !isPredefinedColor ? color : undefined,
      rowGap: resolveSpacing(gapY) ?? resolveSpacing(gap),
      columnGap: resolveSpacing(gapX) ?? resolveSpacing(gap),
      ...style,
    }

    if (p !== undefined) combinedStyle.padding = resolveSpacing(p)
    if (py !== undefined) {
      combinedStyle.paddingTop = resolveSpacing(py)
      combinedStyle.paddingBottom = resolveSpacing(py)
    }
    if (px !== undefined) {
      combinedStyle.paddingLeft = resolveSpacing(px)
      combinedStyle.paddingRight = resolveSpacing(px)
    }

    return (
      <Comp ref={ref} className={classes} style={combinedStyle} {...props}>
        {children}
      </Comp>
    )
  }
)

Flex.displayName = 'Flex'
