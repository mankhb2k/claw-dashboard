import {
  addDays,
  monthDateRange,
  normalizeTimezone,
  resolveAnchorDate,
  resolveMetricsDateRange,
  todayInTimezone,
} from './overview-timezone.util';

describe('overview-timezone.util', () => {
  it('normalizes invalid timezone to UTC', () => {
    expect(normalizeTimezone('Not/A_Zone')).toBe('UTC');
    expect(normalizeTimezone('Asia/Ho_Chi_Minh')).toBe('Asia/Ho_Chi_Minh');
  });

  it('adds days on calendar dates', () => {
    expect(addDays('2026-06-05', -6)).toBe('2026-05-30');
    expect(addDays('2026-06-05', 1)).toBe('2026-06-06');
  });

  it('resolves month boundaries', () => {
    expect(monthDateRange('2026-06-15')).toEqual({
      start: '2026-06-01',
      end: '2026-06-30',
      daysInMonth: 30,
    });
    expect(monthDateRange('2026-02-10').daysInMonth).toBe(28);
  });

  it('uses today in timezone when date omitted', () => {
    const fixed = new Date('2026-06-05T12:00:00.000Z');
    expect(resolveAnchorDate(undefined, 'UTC', fixed)).toBe('2026-06-05');
    expect(todayInTimezone('UTC', fixed)).toBe('2026-06-05');
  });

  it('defaults metrics range to 7 days ending on dateTo', () => {
    const fixed = new Date('2026-06-05T12:00:00.000Z');
    expect(resolveMetricsDateRange(undefined, undefined, 'UTC', fixed)).toEqual({
      dateFrom: '2026-05-30',
      dateTo: '2026-06-05',
    });
  });

  it('rejects inverted metrics ranges', () => {
    expect(() =>
      resolveMetricsDateRange('2026-06-10', '2026-06-01', 'UTC'),
    ).toThrow('dateFrom must be on or before dateTo');
  });
});
