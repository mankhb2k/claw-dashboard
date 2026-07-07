const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function isValidIsoDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

export function parseIsoDate(value: string): {
  year: number
  month: number
  day: number
} | null {
  if (!isValidIsoDate(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  return { year, month, day }
}

export function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function formatDisplayDate(iso: string, locale = 'en-US'): string {
  const parsed = parseIsoDate(iso)
  if (!parsed) return iso
  const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day))
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export function isDateDisabled(
  iso: string,
  min?: string,
  max?: string,
): boolean {
  if (min && iso < min) return true
  if (max && iso > max) return true
  return false
}

export type CalendarDayCell = {
  iso: string
  day: number
  inMonth: boolean
  disabled: boolean
}

export function buildMonthGrid(
  year: number,
  month: number,
  min?: string,
  max?: string,
): CalendarDayCell[] {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const daysInPrevMonth = new Date(Date.UTC(year, month - 1, 0)).getUTCDate()
  const cells: CalendarDayCell[] = []

  for (let i = 0; i < firstWeekday; i += 1) {
    const day = daysInPrevMonth - firstWeekday + i + 1
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    const iso = toIsoDate(prevYear, prevMonth, day)
    cells.push({
      iso,
      day,
      inMonth: false,
      disabled: isDateDisabled(iso, min, max),
    })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const iso = toIsoDate(year, month, day)
    cells.push({
      iso,
      day,
      inMonth: true,
      disabled: isDateDisabled(iso, min, max),
    })
  }

  let nextDay = 1
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  while (cells.length < 42) {
    const iso = toIsoDate(nextYear, nextMonth, nextDay)
    cells.push({
      iso,
      day: nextDay,
      inMonth: false,
      disabled: isDateDisabled(iso, min, max),
    })
    nextDay += 1
  }

  return cells
}

export function monthLabel(year: number, month: number, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)))
}

export const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const
