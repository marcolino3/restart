import { BadRequestException } from '@nestjs/common';
import { datesBetween, weekdayOf } from './shift-plan-dates';

describe('shift-plan-dates', () => {
  it('maps ISO dates to mon..sun', () => {
    expect(weekdayOf('2026-09-07')).toBe('mon');
    expect(weekdayOf('2026-09-13')).toBe('sun');
  });

  it('lists inclusive dates', () => {
    expect(datesBetween('2026-01-30', '2026-02-02')).toEqual([
      '2026-01-30',
      '2026-01-31',
      '2026-02-01',
      '2026-02-02',
    ]);
  });

  it('rejects reversed, too long and malformed ranges', () => {
    expect(() => datesBetween('2026-02-02', '2026-02-01')).toThrow(
      BadRequestException,
    );
    expect(() => datesBetween('2026-01-01', '2026-06-01')).toThrow(
      BadRequestException,
    );
    expect(() => datesBetween('2026-02-30', '2026-03-01')).toThrow(
      BadRequestException,
    );
  });
});
