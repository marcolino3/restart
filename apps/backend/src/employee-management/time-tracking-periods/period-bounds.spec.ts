import { DateTime } from 'luxon';
import { periodBoundsFor, periodLabel } from './period-bounds';

describe('periodBoundsFor', () => {
  it('returns Jan 1 - Dec 31 for the default anchor', () => {
    const { start, end } = periodBoundsFor(
      { month: 1, day: 1 },
      DateTime.fromISO('2026-06-15'),
    );
    expect(start.toISODate()).toBe('2026-01-01');
    expect(end.toISODate()).toBe('2026-12-31');
  });

  it('handles an anchor mid-year, date after anchor stays in the same year', () => {
    const { start, end } = periodBoundsFor(
      { month: 8, day: 1 },
      DateTime.fromISO('2026-09-01'),
    );
    expect(start.toISODate()).toBe('2026-08-01');
    expect(end.toISODate()).toBe('2027-07-31');
  });

  it('handles an anchor mid-year, date before anchor falls into the previous period', () => {
    const { start, end } = periodBoundsFor(
      { month: 8, day: 1 },
      DateTime.fromISO('2026-05-15'),
    );
    expect(start.toISODate()).toBe('2025-08-01');
    expect(end.toISODate()).toBe('2026-07-31');
  });

  it('treats a date exactly on the anchor day as the first day of the new period', () => {
    const { start, end } = periodBoundsFor(
      { month: 8, day: 1 },
      DateTime.fromISO('2026-08-01'),
    );
    expect(start.toISODate()).toBe('2026-08-01');
    expect(end.toISODate()).toBe('2027-07-31');
  });

  it('treats a date one day before the anchor as the last day of the previous period', () => {
    const { start, end } = periodBoundsFor(
      { month: 8, day: 1 },
      DateTime.fromISO('2026-07-31'),
    );
    expect(start.toISODate()).toBe('2025-08-01');
    expect(end.toISODate()).toBe('2026-07-31');
  });

  it('handles a Feb 29 anchor in a leap year', () => {
    const { start, end } = periodBoundsFor(
      { month: 2, day: 29 },
      DateTime.fromISO('2028-03-01'),
    );
    expect(start.toISODate()).toBe('2028-02-29');
    // NOTE: start.plus({ years: 1 }) on Feb 29 lands on Feb 28 the next
    // (non-leap) year per calendar-year semantics, then .minus({ days: 1 })
    // pushes it one further to Feb 27 — see BUG note in the file header.
    expect(end.toISODate()).toBe('2029-02-27');
  });

  it('produces an invalid start date for a Feb 29 anchor evaluated in a non-leap year', () => {
    // BUG: DateTime.fromObject({ year: <non-leap>, month: 2, day: 29 }) is
    // invalid in Luxon (it does NOT overflow to Mar 1), so periodBoundsFor
    // silently returns an invalid `start`/`end` whenever the org anchor is
    // 02-29 and the evaluated date falls in a non-leap year. Downstream,
    // `start.toISODate()` in the service returns null, which breaks the
    // `startDate` column (declared NOT NULL) and period lookups/creation.
    // See report for details — not fixed here (test-only task).
    const { start } = periodBoundsFor(
      { month: 2, day: 29 },
      DateTime.fromISO('2026-06-15'),
    );
    expect(start.isValid).toBe(false);
    expect(start.toISODate()).toBeNull();
  });
});

describe('periodLabel', () => {
  it('returns a single year when start and end fall in the same year', () => {
    expect(periodLabel('2026-01-01', '2026-12-31')).toBe('2026');
  });

  it('returns a slash-separated label when the period spans a year boundary', () => {
    expect(periodLabel('2026-08-01', '2027-07-31')).toBe('2026/27');
  });
});
