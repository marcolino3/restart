import { schoolYearFor, isInForceOn, SchoolYearCutoff } from './school-year';

// 1 August — the default, and what most Swiss schools use.
const AUGUST: SchoolYearCutoff = {
  schoolYearStartMonth: 8,
  schoolYearStartDay: 1,
};

describe('schoolYearFor', () => {
  it('puts a date after the cut-off into the year that just started', () => {
    expect(schoolYearFor('2026-09-15', AUGUST)).toMatchObject({
      start: '2026-08-01',
      end: '2027-07-31',
      startYear: 2026,
      label: '2026/27',
    });
  });

  it('puts a date before the cut-off into the year that started last calendar year', () => {
    // March 2026 still belongs to the school year that began in August 2025.
    expect(schoolYearFor('2026-03-15', AUGUST)).toMatchObject({
      start: '2025-08-01',
      end: '2026-07-31',
      label: '2025/26',
    });
  });

  it('treats the cut-off day itself as the first day of the new year', () => {
    expect(schoolYearFor('2026-08-01', AUGUST).startYear).toBe(2026);
    // ...and the day before as the last day of the old one.
    expect(schoolYearFor('2026-07-31', AUGUST)).toMatchObject({
      startYear: 2025,
      end: '2026-07-31',
    });
  });

  it('handles a cut-off in the middle of the calendar year', () => {
    const february: SchoolYearCutoff = {
      schoolYearStartMonth: 2,
      schoolYearStartDay: 1,
    };
    expect(schoolYearFor('2026-01-31', february)).toMatchObject({
      start: '2025-02-01',
      end: '2026-01-31',
    });
    expect(schoolYearFor('2026-02-01', february).start).toBe('2026-02-01');
  });

  it('ends the year correctly when the next cut-off falls in a leap year', () => {
    const march: SchoolYearCutoff = {
      schoolYearStartMonth: 3,
      schoolYearStartDay: 1,
    };
    // 2027-03-01 minus one day — 2027 is not a leap year, so 28 February.
    expect(schoolYearFor('2026-06-01', march).end).toBe('2027-02-28');
    // 2024 is a leap year, so the day before 2024-03-01 is 29 February.
    expect(schoolYearFor('2023-06-01', march).end).toBe('2024-02-29');
  });

  it('pads the label across a century boundary', () => {
    expect(schoolYearFor('2099-09-01', AUGUST).label).toBe('2099/00');
    expect(schoolYearFor('2100-09-01', AUGUST).label).toBe('2100/01');
  });
});

describe('isInForceOn', () => {
  const range = { validFrom: '2025-08-01', validTo: '2026-07-31' };

  it('includes both boundary days', () => {
    expect(isInForceOn(range, '2025-08-01')).toBe(true);
    expect(isInForceOn(range, '2026-07-31')).toBe(true);
  });

  it('excludes dates outside the range', () => {
    expect(isInForceOn(range, '2025-07-31')).toBe(false);
    expect(isInForceOn(range, '2026-08-01')).toBe(false);
  });

  it('treats a missing end date as still running', () => {
    const open = { validFrom: '2025-08-01', validTo: null };
    expect(isInForceOn(open, '2099-01-01')).toBe(true);
    // ...but not before it started.
    expect(isInForceOn(open, '2025-07-31')).toBe(false);
  });
});
