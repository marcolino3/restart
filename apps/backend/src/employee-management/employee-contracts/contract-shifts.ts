import { BadRequestException } from '@nestjs/common';
import type {
  EmployeeContract,
  ShiftPreference,
} from './entities/employee-contract.entity';
import { ShiftPreferenceLevel } from './entities/employee-contract.entity';

export const WEEKDAY_KEYS = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
] as const;
export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

type ShiftFields = Pick<
  EmployeeContract,
  | 'worksShifts'
  | 'shiftWeekdays'
  | 'shiftPreferences'
  | 'weekdayWorkloads'
  | 'weekdayTimeWindows'
>;

/**
 * Weekdays the contract schedules work on: exact time windows win, then the
 * workload split. `null` when the contract carries no per-day schedule at all
 * (weekly hours only) — every weekday is allowed then.
 */
export function contractWorkingDays(
  contract: Pick<ShiftFields, 'weekdayWorkloads' | 'weekdayTimeWindows'>,
): WeekdayKey[] | null {
  const windows = contract.weekdayTimeWindows;
  if (windows) {
    const days = WEEKDAY_KEYS.filter((d) => (windows[d]?.length ?? 0) > 0);
    if (days.length > 0) return days;
  }
  const workloads = contract.weekdayWorkloads;
  if (workloads) {
    const days = WEEKDAY_KEYS.filter((d) => (workloads[d] ?? 0) > 0);
    if (days.length > 0) return days;
  }
  return null;
}

/**
 * Normalises the shift-work fields in place. Without shift work everything is
 * cleared; with it, the shift weekdays must be a subset of the working days
 * and every preference must point at a shift of the organisation
 * (`knownShiftIds`). Duplicates are collapsed, neutral preferences dropped.
 */
export function normalizeContractShiftFields(
  contract: ShiftFields,
  knownShiftIds: ReadonlySet<string>,
): void {
  if (!contract.worksShifts) {
    contract.worksShifts = false;
    contract.shiftWeekdays = [];
    contract.shiftPreferences = [];
    return;
  }

  const weekdays = [...new Set(contract.shiftWeekdays ?? [])].map((day) => {
    if (!(WEEKDAY_KEYS as readonly string[]).includes(day)) {
      throw new BadRequestException(`Unknown weekday "${day}"`);
    }
    return day as WeekdayKey;
  });
  const workingDays = contractWorkingDays(contract);
  if (workingDays) {
    const outside = weekdays.filter((d) => !workingDays.includes(d));
    if (outside.length > 0) {
      throw new BadRequestException(
        `Shift weekdays must be working days of the contract: ${outside.join(', ')}`,
      );
    }
  }
  contract.shiftWeekdays = WEEKDAY_KEYS.filter((d) => weekdays.includes(d));

  const seen = new Set<string>();
  const preferences: ShiftPreference[] = [];
  for (const pref of contract.shiftPreferences ?? []) {
    if (!knownShiftIds.has(pref.shiftId)) {
      throw new BadRequestException(`Unknown shift "${pref.shiftId}"`);
    }
    if (seen.has(pref.shiftId)) continue;
    seen.add(pref.shiftId);
    if (pref.level === ShiftPreferenceLevel.NEUTRAL) continue;
    preferences.push({ shiftId: pref.shiftId, level: pref.level });
  }
  contract.shiftPreferences = preferences;
}
