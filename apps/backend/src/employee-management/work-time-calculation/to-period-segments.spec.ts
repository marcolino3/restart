import { DateTime } from 'luxon';
import { toCurrentPeriodSegments } from './to-period-segments';
import { periodBoundsFor } from '@/employee-management/time-tracking-periods/period-bounds';
import { Holiday } from '@/employee-management/holidays/entities/holiday.entity';

const anchor = { month: 1, day: 1 };
const current = periodBoundsFor(anchor, DateTime.now());

describe('toCurrentPeriodSegments', () => {
  it('returns only the part of a source falling into the current period', () => {
    const currentStart = current.start.toISODate() as string;
    const currentEnd = current.end.toISODate() as string;

    const result = toCurrentPeriodSegments(
      [
        {
          id: 'src-1',
          name: 'Sommerferien',
          startDate: currentStart,
          endDate: currentEnd,
        },
      ],
      anchor,
      [],
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: `src-1:${currentStart}`,
      sourceId: 'src-1',
      name: 'Sommerferien',
      startDate: currentStart,
      endDate: currentEnd,
      isSplit: false,
    });
  });

  it('excludes sources entirely outside the current period', () => {
    const before = current.start.minus({ years: 2 }).toISODate() as string;
    const beforeEnd = current.start.minus({ years: 1 }).toISODate() as string;

    const result = toCurrentPeriodSegments(
      [{ id: 'src-old', name: null, startDate: before, endDate: beforeEnd }],
      anchor,
      [],
    );

    expect(result).toEqual([]);
  });

  it('marks isSplit true and clips effectiveDays when a source crosses the anchor', () => {
    const spanStart = current.start.minus({ days: 5 }).toISODate() as string;
    const spanEnd = current.start.plus({ days: 4 }).toISODate() as string;

    const result = toCurrentPeriodSegments(
      [{ id: 'src-split', name: null, startDate: spanStart, endDate: spanEnd }],
      anchor,
      [],
    );

    expect(result).toHaveLength(1);
    expect(result[0].isSplit).toBe(true);
    expect(result[0].startDate).toBe(current.start.toISODate());
    expect(result[0].endDate).toBe(spanEnd);
  });

  it('excludes a weekend holiday from effectiveDays but keeps it in holidays', () => {
    const currentStart = current.start.toISODate() as string;
    const rangeEnd = current.start.plus({ days: 6 }).toISODate() as string;
    const weekendDate = current.start.plus({ days: 3 });
    const isWeekend = weekendDate.weekday >= 6;

    const holiday = {
      id: 'h-1',
      organizationId: 'org-a',
      isActive: true,
      name: 'Testfeiertag',
      date: weekendDate.toISODate() as string,
      paidPercentage: 100,
    } as unknown as Holiday;

    const withoutHoliday = toCurrentPeriodSegments(
      [{ id: 'src-h', name: null, startDate: currentStart, endDate: rangeEnd }],
      anchor,
      [],
    );
    const withHoliday = toCurrentPeriodSegments(
      [{ id: 'src-h', name: null, startDate: currentStart, endDate: rangeEnd }],
      anchor,
      [holiday],
    );

    expect(withHoliday[0].holidays).toHaveLength(1);
    expect(withHoliday[0].holidays[0].name).toBe('Testfeiertag');
    if (isWeekend) {
      expect(withHoliday[0].effectiveDays).toBe(
        withoutHoliday[0].effectiveDays,
      );
    } else {
      expect(withHoliday[0].effectiveDays).toBeLessThan(
        withoutHoliday[0].effectiveDays,
      );
    }
  });

  it('sorts segments by startDate', () => {
    const later = current.start.plus({ days: 10 }).toISODate() as string;
    const laterEnd = current.start.plus({ days: 12 }).toISODate() as string;
    const earlier = current.start.plus({ days: 1 }).toISODate() as string;
    const earlierEnd = current.start.plus({ days: 2 }).toISODate() as string;

    const result = toCurrentPeriodSegments(
      [
        { id: 'later', name: null, startDate: later, endDate: laterEnd },
        { id: 'earlier', name: null, startDate: earlier, endDate: earlierEnd },
      ],
      anchor,
      [],
    );

    expect(result.map((s) => s.sourceId)).toEqual(['earlier', 'later']);
  });
});
