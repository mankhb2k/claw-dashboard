import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import styles from './Slider.module.css'

export interface SliderProps extends SliderPrimitive.SliderProps {
  label?: string
}

export const Slider = React.forwardRef<HTMLSpanElement, SliderProps>(
  ({ label, className, style, ...props }, ref) => {
    return (
      <div className={styles.wrapper}>
        {label && <label className={styles.label}>{label}</label>}
        <SliderPrimitive.Root
          ref={ref}
          className={`${styles.root} ${className || ''}`}
          style={style}
          {...props}
        >
          <SliderPrimitive.Track className={styles.track}>
            <SliderPrimitive.Range className={styles.range} />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb className={styles.thumb} />
        </SliderPrimitive.Root>
      </div>
    )
  }
)

Slider.displayName = 'Slider'
