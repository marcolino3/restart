import { BadRequestException } from '@nestjs/common';
import { ShiftBreak } from './dto/shift-break.input';

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.slice(0, 5).split(':').map(Number);
  return h * 60 + m;
};

/** Minutes from `start` to `end`, wrapping past midnight (07:00→12:00 = 300). */
export const shiftDurationMinutes = (start: string, end: string): number => {
  const s = toMinutes(start);
  const e = toMinutes(end);
  return e >= s ? e - s : 24 * 60 - s + e;
};

/** Minutes from shift start to `time`, wrapping past midnight. */
const offsetFromStart = (shiftStart: string, time: string): number => {
  const s = toMinutes(shiftStart);
  const t = toMinutes(time);
  return t >= s ? t - s : 24 * 60 - s + t;
};

/**
 * Validates unpaid breaks against the shift window: each break must have a
 * positive length, lie fully inside the shift and not overlap another break.
 * Returns the breaks sorted by their position within the shift.
 */
export function normalizeShiftBreaks(
  shiftStart: string,
  shiftEnd: string,
  breaks: ShiftBreak[] | null | undefined,
): ShiftBreak[] {
  const list = (breaks ?? []).map((b) => ({
    startTime: b.startTime.slice(0, 5),
    endTime: b.endTime.slice(0, 5),
  }));
  const shiftLength = shiftDurationMinutes(shiftStart, shiftEnd);

  const positioned = list.map((b) => {
    const from = offsetFromStart(shiftStart, b.startTime);
    const to = offsetFromStart(shiftStart, b.endTime);
    if (to <= from) {
      throw new BadRequestException(
        `Break ${b.startTime}–${b.endTime} must end after it starts`,
      );
    }
    if (to > shiftLength) {
      throw new BadRequestException(
        `Break ${b.startTime}–${b.endTime} lies outside the shift`,
      );
    }
    return { ...b, from, to };
  });

  positioned.sort((a, b) => a.from - b.from);
  for (let i = 1; i < positioned.length; i++) {
    if (positioned[i].from < positioned[i - 1].to) {
      throw new BadRequestException('Breaks must not overlap');
    }
  }

  return positioned.map(({ startTime, endTime }) => ({ startTime, endTime }));
}

/** Total unpaid break minutes. */
export const breakMinutes = (breaks: ShiftBreak[]): number =>
  breaks.reduce(
    (sum, b) => sum + shiftDurationMinutes(b.startTime, b.endTime),
    0,
  );
