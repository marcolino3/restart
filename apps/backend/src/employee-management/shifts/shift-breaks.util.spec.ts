import { BadRequestException } from '@nestjs/common';
import {
  breakMinutes,
  normalizeShiftBreaks,
  shiftDurationMinutes,
} from './shift-breaks.util';

describe('shift-breaks.util', () => {
  it('computes same-day and overnight shift lengths', () => {
    expect(shiftDurationMinutes('07:00', '12:30')).toBe(330);
    expect(shiftDurationMinutes('22:00', '06:00')).toBe(480);
    expect(shiftDurationMinutes('07:00:00', '12:00:00')).toBe(300);
  });

  it('accepts breaks inside the shift and sorts them', () => {
    expect(
      normalizeShiftBreaks('07:00', '17:00', [
        { startTime: '15:00', endTime: '15:15' },
        { startTime: '12:00', endTime: '12:45' },
      ]),
    ).toEqual([
      { startTime: '12:00', endTime: '12:45' },
      { startTime: '15:00', endTime: '15:15' },
    ]);
  });

  it('accepts a break after midnight in a night shift', () => {
    expect(
      normalizeShiftBreaks('22:00', '06:00', [
        { startTime: '01:30', endTime: '02:00' },
      ]),
    ).toEqual([{ startTime: '01:30', endTime: '02:00' }]);
  });

  it('rejects a break outside the shift', () => {
    expect(() =>
      normalizeShiftBreaks('07:00', '12:00', [
        { startTime: '12:00', endTime: '12:30' },
      ]),
    ).toThrow(BadRequestException);
    expect(() =>
      normalizeShiftBreaks('07:00', '12:00', [
        { startTime: '06:30', endTime: '07:15' },
      ]),
    ).toThrow(BadRequestException);
  });

  it('rejects zero-length and overlapping breaks', () => {
    expect(() =>
      normalizeShiftBreaks('07:00', '17:00', [
        { startTime: '12:00', endTime: '12:00' },
      ]),
    ).toThrow(BadRequestException);
    expect(() =>
      normalizeShiftBreaks('07:00', '17:00', [
        { startTime: '12:00', endTime: '12:45' },
        { startTime: '12:30', endTime: '13:00' },
      ]),
    ).toThrow(BadRequestException);
  });

  it('sums break minutes', () => {
    expect(
      breakMinutes([
        { startTime: '12:00', endTime: '12:45' },
        { startTime: '15:00', endTime: '15:15' },
      ]),
    ).toBe(60);
  });
});
