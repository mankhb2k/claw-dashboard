'use client'

import * as React from 'react'
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import styles from './ToggleGroup.module.css'

export type ToggleGroupProps = React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & {
  className?: string
  children?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export type ToggleGroupItemProps = React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> & {
  className?: string
  children?: React.ReactNode
}

export const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  ToggleGroupProps
>(({ className, children, type, size = 'md', ...props }, ref) => {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = React.useState<React.CSSProperties>({})

  React.useImperativeHandle(ref, () => rootRef.current as any)

  React.useEffect(() => {
    if (type === 'single' && rootRef.current) {
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
    }
  }, [type])

  const isSingle = type === 'single'

  const handleValueChange = (value: any) => {
    if (isSingle && !value) return
    props.onValueChange?.(value)
  }

  return (
    <ToggleGroupPrimitive.Root
      ref={rootRef}
      type={type as any}
      className={`${styles.root} ${styles[`root--${size}`]} ${isSingle ? styles.singleSelect : ''} ${className || ''}`}
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
>(({ className, ...props }, ref) => (
  <ToggleGroupPrimitive.Item
    ref={ref}
    className={`${styles.item} ${className || ''}`}
    {...(props as any)}
  />
))

ToggleGroupItem.displayName = 'ToggleGroupItem'
