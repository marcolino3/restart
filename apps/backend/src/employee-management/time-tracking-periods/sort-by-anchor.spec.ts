import { sortByPeriodAnchor } from './sort-by-anchor';

interface Entry {
  date: string;
}

const order = (
  dates: string[],
  anchor: { month: number; day: number },
): string[] =>
  sortByPeriodAnchor<Entry>(
    dates.map((date) => ({ date })),
    anchor,
    (e) => e.date,
  ).map((e) => e.date);

describe('sortByPeriodAnchor', () => {
  const augustFirst = { month: 8, day: 1 };

  it('puts the anchor date first and wraps earlier months to the end', () => {
    expect(
      order(
        ['2026-01-01', '2026-08-01', '2026-12-25', '2026-05-01'],
        augustFirst,
      ),
    ).toEqual(['2026-08-01', '2026-12-25', '2026-01-01', '2026-05-01']);
  });

  it('sorts by month/day regardless of the calendar year', () => {
    expect(
      order(['2024-09-10', '2026-08-05', '2025-03-01'], augustFirst),
    ).toEqual(['2026-08-05', '2024-09-10', '2025-03-01']);
  });

  it('falls back to the full date for identical month/day', () => {
    expect(
      order(['2027-08-01', '2025-08-01', '2026-08-01'], augustFirst),
    ).toEqual(['2025-08-01', '2026-08-01', '2027-08-01']);
  });

  it('keeps calendar order for a January anchor', () => {
    expect(
      order(['2026-08-01', '2026-01-01', '2026-12-31'], { month: 1, day: 1 }),
    ).toEqual(['2026-01-01', '2026-08-01', '2026-12-31']);
  });

  it('treats the day before the anchor as the last entry', () => {
    expect(
      order(['2026-07-31', '2026-08-01', '2026-08-02'], augustFirst),
    ).toEqual(['2026-08-01', '2026-08-02', '2026-07-31']);
  });

  it('does not mutate the input array', () => {
    const input: Entry[] = [{ date: '2026-01-01' }, { date: '2026-08-01' }];
    sortByPeriodAnchor(input, augustFirst, (e) => e.date);
    expect(input.map((e) => e.date)).toEqual(['2026-01-01', '2026-08-01']);
  });
});
