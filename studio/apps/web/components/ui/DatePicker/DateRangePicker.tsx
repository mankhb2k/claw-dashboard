'use client'

import { DatePicker, type DatePickerSize } from './DatePicker'
import styles from './DatePicker.module.css'

export interface DateRangePickerProps {
  from?: string
  to?: string
  onFromChange?: (value: string) => void
  onToChange?: (value: string) => void
  fromLabel?: string
  toLabel?: string
  size?: DatePickerSize
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
}

export function DateRangePicker({
  from = '',
  to = '',
  onFromChange,
  onToChange,
  fromLabel = 'From',
  toLabel = 'To',
  size = 'md',
  disabled = false,
  className,
  style,
}: DateRangePickerProps) {
  const rangePickerClass =
    size === 'sm' ? styles.rangePickerSm : styles.rangePickerMd

  return (
    <div className={`${styles.rangeRow} ${className ?? ''}`} style={style}>
      <div className={styles.rangeItem}>
        <span className={styles.rangeLabel}>{fromLabel}</span>
        <div className={rangePickerClass}>
          <DatePicker
            value={from}
            onChange={onFromChange}
            max={to || undefined}
            disabled={disabled}
            size={size}
            placeholder="Start"
          />
        </div>
      </div>
      <div className={styles.rangeItem}>
        <span className={styles.rangeLabel}>{toLabel}</span>
        <div className={rangePickerClass}>
          <DatePicker
            value={to}
            onChange={onToChange}
            min={from || undefined}
            disabled={disabled}
            size={size}
            placeholder="End"
          />
        </div>
      </div>
    </div>
  )
}
