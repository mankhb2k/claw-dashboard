const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIanaTimezone(tz: string): boolean {
  const trimmed = tz.trim();
  if (!trimmed) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: trimmed });
    return true;
  } catch {
    return false;
  }
}

export function normalizeTimezone(tz: string | null | undefined): string {
  const candidate = tz?.trim() || 'UTC';
  return isValidIanaTimezone(candidate) ? candidate : 'UTC';
}

export function todayInTimezone(tz: string, now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(now);
}

export function parseDateOnly(date: string): { year: number; month: number; day: number } {
  if (!DATE_RE.test(date)) {
    throw new Error('Invalid date format, expected YYYY-MM-DD');
  }
  const [year, month, day] = date.split('-').map((part) => Number(part));
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error('Invalid date');
  }
  return { year, month, day };
}

export function addDays(date: string, delta: number): string {
  const { year, month, day } = parseDateOnly(date);
  const utc = new Date(Date.UTC(year, month - 1, day));
  utc.setUTCDate(utc.getUTCDate() + delta);
  return utc.toISOString().slice(0, 10);
}

export function monthDateRange(anchorDate: string): {
  start: string;
  end: string;
  daysInMonth: number;
} {
  const { year, month } = parseDateOnly(anchorDate);
  const monthPadded = String(month).padStart(2, '0');
  const start = `${year}-${monthPadded}-01`;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const end = `${year}-${monthPadded}-${String(daysInMonth).padStart(2, '0')}`;
  return { start, end, daysInMonth };
}

export function resolveAnchorDate(input: string | undefined, tz: string, now = new Date()): string {
  if (!input?.trim()) {
    return todayInTimezone(tz, now);
  }
  parseDateOnly(input.trim());
  return input.trim();
}

export function resolveMetricsDateRange(
  fromInput: string | undefined,
  toInput: string | undefined,
  tz: string,
  now = new Date(),
): { dateFrom: string; dateTo: string } {
  const dateTo = resolveAnchorDate(toInput, tz, now);
  const dateFrom = fromInput?.trim()
    ? resolveAnchorDate(fromInput, tz, now)
    : addDays(dateTo, -6);

  if (dateFrom > dateTo) {
    throw new Error('dateFrom must be on or before dateTo');
  }

  return { dateFrom, dateTo };
}
