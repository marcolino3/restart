import { splitByPeriodAnchor } from './split-by-period';
import { periodLabel } from '@/employee-management/time-tracking-periods/period-bounds';

// Stichtag 1. August: Periode laeuft 01.08. bis 31.07. des Folgejahres.
const august = { month: 8, day: 1 };

describe('splitByPeriodAnchor', () => {
  it('returns a single segment for a range inside one period', () => {
    expect(splitByPeriodAnchor('2026-10-05', '2026-10-18', august)).toEqual([
      {
        startDate: '2026-10-05',
        endDate: '2026-10-18',
        periodStartDate: '2026-08-01',
        periodEndDate: '2027-07-31',
      },
    ]);
  });

  it('splits a range crossing the anchor at the day before it', () => {
    const segments = splitByPeriodAnchor('2027-07-19', '2027-08-16', august);
    expect(segments).toEqual([
      {
        startDate: '2027-07-19',
        endDate: '2027-07-31',
        periodStartDate: '2026-08-01',
        periodEndDate: '2027-07-31',
      },
      {
        startDate: '2027-08-01',
        endDate: '2027-08-16',
        periodStartDate: '2027-08-01',
        periodEndDate: '2028-07-31',
      },
    ]);
  });

  it('keeps a range starting exactly on the anchor whole', () => {
    const segments = splitByPeriodAnchor('2026-08-01', '2026-08-14', august);
    expect(segments).toHaveLength(1);
    expect(segments[0].periodStartDate).toBe('2026-08-01');
  });

  it('keeps a range ending exactly on the day before the anchor whole', () => {
    const segments = splitByPeriodAnchor('2027-07-20', '2027-07-31', august);
    expect(segments).toHaveLength(1);
    expect(segments[0].periodEndDate).toBe('2027-07-31');
  });

  it('splits a multi-year range into one segment per period', () => {
    const segments = splitByPeriodAnchor('2026-07-01', '2028-09-01', august);
    expect(segments.map((s) => [s.startDate, s.endDate])).toEqual([
      ['2026-07-01', '2026-07-31'],
      ['2026-08-01', '2027-07-31'],
      ['2027-08-01', '2028-07-31'],
      ['2028-08-01', '2028-09-01'],
    ]);
  });

  it('covers the original range without gaps or overlaps', () => {
    const segments = splitByPeriodAnchor('2027-07-19', '2027-08-16', august);
    expect(segments[0].startDate).toBe('2027-07-19');
    expect(segments[segments.length - 1].endDate).toBe('2027-08-16');
    for (let i = 1; i < segments.length; i++) {
      const prevEnd = new Date(segments[i - 1].endDate);
      const nextStart = new Date(segments[i].startDate);
      const gapDays =
        (nextStart.getTime() - prevEnd.getTime()) / (24 * 60 * 60 * 1000);
      expect(gapDays).toBe(1);
    }
  });

  it('treats a single day as one segment', () => {
    expect(
      splitByPeriodAnchor('2026-09-09', '2026-09-09', august),
    ).toHaveLength(1);
  });

  it('returns nothing when the range is reversed', () => {
    expect(splitByPeriodAnchor('2026-09-09', '2026-09-01', august)).toEqual([]);
  });

  it('uses calendar periods when the anchor is 1 January', () => {
    const segments = splitByPeriodAnchor('2026-12-28', '2027-01-05', {
      month: 1,
      day: 1,
    });
    expect(segments.map((s) => [s.startDate, s.endDate])).toEqual([
      ['2026-12-28', '2026-12-31'],
      ['2027-01-01', '2027-01-05'],
    ]);
  });
});

describe('periodLabel', () => {
  it('uses a single year when the period stays inside one', () => {
    expect(periodLabel('2026-01-01', '2026-12-31')).toBe('2026');
  });

  it('uses a shortened span when the period crosses the year', () => {
    expect(periodLabel('2026-08-01', '2027-07-31')).toBe('2026/27');
  });
});
