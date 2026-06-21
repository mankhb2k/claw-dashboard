"use client";

import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { forwardRef, useMemo, useState } from "react";

import {
  buildMonthGrid,
  formatDisplayDate,
  isValidIsoDate,
  monthLabel,
  parseIsoDate,
  WEEKDAY_LABELS,
} from "./date-picker.utils";
import styles from "./DatePicker.module.css";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu/DropdownMenu";

export type DatePickerSize = 'sm' | 'md'

export interface DatePickerProps {
  id?: string
  label?: string
  error?: string
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  min?: string
  max?: string
  disabled?: boolean
  size?: DatePickerSize
  className?: string
  style?: React.CSSProperties
}

interface CalendarPanelProps {
  value?: string;
  min?: string;
  max?: string;
  onSelect: (iso: string) => void;
}

function CalendarPanel({ value, min, max, onSelect }: CalendarPanelProps) {
  const initial = parseIsoDate(value ?? "") ?? {
    year: new Date().getUTCFullYear(),
    month: new Date().getUTCMonth() + 1,
    day: 1,
  };
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);

  const cells = useMemo(
    () => buildMonthGrid(viewYear, viewMonth, min, max),
    [viewYear, viewMonth, min, max],
  );

  const goMonth = (delta: number) => {
    let month = viewMonth + delta;
    let year = viewYear;
    while (month < 1) {
      month += 12;
      year -= 1;
    }
    while (month > 12) {
      month -= 12;
      year += 1;
    }
    setViewMonth(month);
    setViewYear(year);
  };

  return (
    <div>
      <div className={styles.calendarHeader}>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => goMonth(-1)}
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </button>
        <span className={styles.monthTitle}>
          {monthLabel(viewYear, viewMonth)}
        </span>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => goMonth(1)}
          aria-label="Next month"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className={styles.weekdays}>
        {WEEKDAY_LABELS.map((day) => (
          <span key={day} className={styles.weekday}>
            {day}
          </span>
        ))}
      </div>

      <div className={styles.grid}>
        {cells.map((cell) => {
          const selected = value === cell.iso;
          const className = [
            styles.dayButton,
            !cell.inMonth ? styles.dayOutside : "",
            selected ? styles.daySelected : "",
            cell.disabled ? styles.dayDisabled : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={cell.iso}
              type="button"
              className={className}
              disabled={cell.disabled}
              onClick={() => onSelect(cell.iso)}
              aria-label={cell.iso}
              aria-pressed={selected}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const DatePicker = forwardRef<HTMLButtonElement, DatePickerProps>(
  (
    {
      id,
      label,
      error,
      value = "",
      onChange,
      placeholder = "Select date",
      min,
      max,
      disabled = false,
      size = 'md',
      className,
      style,
    },
    ref,
  ) => {
    const [open, setOpen] = useState(false);
    const displayValue =
      value && isValidIsoDate(value) ? formatDisplayDate(value) : "";
    const iconSize = size === "sm" ? 14 : 16;

    const triggerClass = [
      styles.trigger,
      size === "sm" ? styles.triggerSm : styles.triggerMd,
      error ? styles.triggerError : "",
      disabled ? styles.triggerDisabled : "",
      className ?? "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={styles.field}>
        {label ? (
          <label className={styles.label} htmlFor={id}>
            {label}
          </label>
        ) : null}

        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger
            ref={ref}
            id={id}
            type="button"
            variant="unstyled"
            className={triggerClass}
            style={style}
            disabled={disabled}
            aria-invalid={!!error}
          >
            <span
              className={displayValue ? undefined : styles.triggerPlaceholder}
            >
              {displayValue || placeholder}
            </span>
            <Calendar size={iconSize} className={styles.triggerIcon} aria-hidden />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            className={styles.calendarContent}
            onCloseAutoFocus={(event) => event.preventDefault()}
          >
            <CalendarPanel
              value={value}
              min={min}
              max={max}
              onSelect={(iso) => {
                onChange?.(iso);
                setOpen(false);
              }}
            />
          </DropdownMenuContent>
        </DropdownMenu>

        {error ? <span className={styles.error}>{error}</span> : null}
      </div>
    );
  },
);

DatePicker.displayName = "DatePicker";
