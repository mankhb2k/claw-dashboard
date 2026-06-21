'use client'

import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import * as React from 'react'

import styles from './ToggleGroup.module.css'

export type ToggleGroupProps = React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & {
  children?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export type ToggleGroupItemProps = React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> & {
  children?: React.ReactNode
}

export const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  ToggleGroupProps
>(({ className, children, type, size = 'md', style, ...props }, ref) => {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = React.useState<React.CSSProperties>({})

  React.useImperativeHandle(
    ref,
    () => rootRef.current as React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  )

  React.useEffect(() => {
    if (type !== 'single' || !rootRef.current) {
      return undefined
    }

    const updateIndicator = () => {
      const activeItem = rootRef.current?.querySelector('[data-state="on"]') as HTMLElement
      if (activeItem) {
        setIndicatorStyle({
          width: `${activeItem.offsetWidth}px`,
          height: `${activeItem.offsetHeight}px`,
          transform: `translate(${activeItem.offsetLeft}px, ${activeItem.offsetTop}px)`,
        })
      } else {
        setIndicatorStyle({ width: 0, height: 0 })
      }
    }

    updateIndicator()

    const observer = new MutationObserver(updateIndicator)
    observer.observe(rootRef.current, {
      attributes: true,
      subtree: true,
      attributeFilter: ['data-state'],
    })

    return () => observer.disconnect()
  }, [type])

  const isSingle = type === 'single'

  const handleValueChange = (value: string | string[]) => {
    if (isSingle && !value) return
    ;(props.onValueChange as ((value: string | string[]) => void) | undefined)?.(value)
  }

  return (
    <ToggleGroupPrimitive.Root
      ref={rootRef}
      // Radix Root is a discriminated union (single|multiple) that is hard to type when spreading props.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type={type as any}
      className={`${styles.root} ${styles[`root--${size}`]} ${isSingle ? styles.singleSelect : ''} ${className || ''}`}
      style={style}
      {...props}
      onValueChange={handleValueChange}
    >
      {isSingle && (
        <div className={styles.indicator} style={indicatorStyle} />
      )}
      {children}
    </ToggleGroupPrimitive.Root>
  )
})

ToggleGroup.displayName = 'ToggleGroup'

export const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  ToggleGroupItemProps
>(({ className, style, ...props }, ref) => (
  <ToggleGroupPrimitive.Item
    ref={ref}
    className={`${styles.item} ${className || ''}`}
    style={style}
    {...props}
  />
))

ToggleGroupItem.displayName = 'ToggleGroupItem'
