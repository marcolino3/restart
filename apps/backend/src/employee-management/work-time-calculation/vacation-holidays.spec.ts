import {
  calculateEffectiveVacationDays,
  listVacationHolidays,
} from './work-time-calculation';
import { CalcHoliday } from './work-time-calculation.types';

const holiday = (
  date: string,
  name: string,
  paidPercentage = 100,
  repeatsYearly = false,
): CalcHoliday & { name: string } => ({
  date,
  name,
  paidPercentage,
  repeatsYearly,
});

describe('company vacation holidays', () => {
  // Mo 03.08.2026 – So 16.08.2026: 10 Werktage.
  const from = '2026-08-03';
  const to = '2026-08-16';

  describe('calculateEffectiveVacationDays', () => {
    it('counts weekdays and skips weekends', () => {
      expect(calculateEffectiveVacationDays(from, to, [])).toBe(10);
    });

    it('subtracts a fully paid holiday inside the range', () => {
      const holidays = [holiday('2026-08-05', 'Test')];
      expect(calculateEffectiveVacationDays(from, to, holidays)).toBe(9);
    });

    it('subtracts a partially paid holiday proportionally', () => {
      const holidays = [holiday('2026-08-05', 'Half', 50)];
      expect(calculateEffectiveVacationDays(from, to, holidays)).toBe(9.5);
    });

    it('ignores holidays outside the range', () => {
      const holidays = [holiday('2026-08-01', '1. August')];
      expect(calculateEffectiveVacationDays(from, to, holidays)).toBe(10);
    });

    it('ignores a holiday falling on a weekend', () => {
      const holidays = [holiday('2026-08-08', 'Saturday')];
      expect(calculateEffectiveVacationDays(from, to, holidays)).toBe(10);
    });

    it('applies a yearly holiday anchored in another year', () => {
      const holidays = [holiday('2020-08-05', 'Yearly', 100, true)];
      expect(calculateEffectiveVacationDays(from, to, holidays)).toBe(9);
    });
  });

  describe('listVacationHolidays', () => {
    it('returns nothing when no holiday falls in the range', () => {
      expect(listVacationHolidays(from, to, [])).toEqual([]);
    });

    it('lists holidays in calendar order with their names', () => {
      const holidays = [
        holiday('2026-08-13', 'Later'),
        holiday('2026-08-05', 'Earlier'),
      ];
      expect(
        listVacationHolidays(from, to, holidays).map((h) => [
          h.date,
          h.holiday.name,
        ]),
      ).toEqual([
        ['2026-08-05', 'Earlier'],
        ['2026-08-13', 'Later'],
      ]);
    });

    it('resolves a yearly holiday to the date inside the range', () => {
      const holidays = [holiday('2020-08-05', 'Yearly', 100, true)];
      const hits = listVacationHolidays(from, to, holidays);
      expect(hits).toHaveLength(1);
      // Konkretes Datum im Zeitraum, nicht das Ankerjahr 2020.
      expect(hits[0].date).toBe('2026-08-05');
      expect(hits[0].holiday.name).toBe('Yearly');
    });

    it('excludes holidays outside the range', () => {
      const holidays = [
        holiday('2026-08-01', 'Before'),
        holiday('2026-08-20', 'After'),
      ];
      expect(listVacationHolidays(from, to, holidays)).toEqual([]);
    });

    it('lists a weekend holiday inside the range, marked as such', () => {
      const holidays = [holiday('2026-08-08', 'Saturday')];
      const hits = listVacationHolidays(from, to, holidays);
      expect(hits).toHaveLength(1);
      expect(hits[0].isWeekend).toBe(true);
    });

    it('marks weekday holidays as not on a weekend', () => {
      const hits = listVacationHolidays(from, to, [
        holiday('2026-08-05', 'Full'),
      ]);
      expect(hits[0].isWeekend).toBe(false);
    });

    it('reduces effective days only by the non-weekend holidays listed', () => {
      const holidays = [
        holiday('2026-08-05', 'Full'),
        holiday('2026-08-08', 'Weekend'),
        holiday('2026-08-13', 'Full 2'),
      ];
      const listed = listVacationHolidays(from, to, holidays);
      const effective = calculateEffectiveVacationDays(from, to, holidays);
      // Alle drei gelistet, aber nur die zwei Werktags-Feiertage sparen Tage.
      expect(listed).toHaveLength(3);
      const reducing = listed.filter((h) => !h.isWeekend);
      expect(effective).toBe(10 - reducing.length);
    });
  });
});
