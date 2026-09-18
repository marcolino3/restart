import { BadRequestException } from '@nestjs/common';
import {
  contractWorkingDays,
  normalizeContractShiftFields,
} from './contract-shifts';
import { ShiftPreferenceLevel } from './entities/employee-contract.entity';

const SHIFTS = new Set(['s-early', 's-late']);

describe('contractWorkingDays', () => {
  it('prefers exact time windows over workloads', () => {
    expect(
      contractWorkingDays({
        weekdayTimeWindows: {
          tue: [{ start: '08:00', end: '12:00' }],
          wed: [],
        },
        weekdayWorkloads: { mon: 20, tue: 20, wed: 20 },
      }),
    ).toEqual(['tue']);
  });

  it('falls back to workloads and to null without a per-day schedule', () => {
    expect(
      contractWorkingDays({ weekdayWorkloads: { mon: 20, tue: 0, fri: 20 } }),
    ).toEqual(['mon', 'fri']);
    expect(contractWorkingDays({})).toBeNull();
    expect(contractWorkingDays({ weekdayWorkloads: {} })).toBeNull();
  });
});

describe('normalizeContractShiftFields', () => {
  it('clears everything when the contract does not work shifts', () => {
    const contract = {
      worksShifts: false,
      shiftWeekdays: ['mon'],
      shiftPreferences: [
        { shiftId: 's-early', level: ShiftPreferenceLevel.PREFERRED },
      ],
    };
    normalizeContractShiftFields(contract, SHIFTS);
    expect(contract).toEqual({
      worksShifts: false,
      shiftWeekdays: [],
      shiftPreferences: [],
    });
  });

  it('sorts and de-duplicates weekdays, drops neutral and duplicate preferences', () => {
    const contract = {
      worksShifts: true,
      shiftWeekdays: ['wed', 'mon', 'mon'],
      shiftPreferences: [
        { shiftId: 's-late', level: ShiftPreferenceLevel.AVOID },
        { shiftId: 's-early', level: ShiftPreferenceLevel.NEUTRAL },
        { shiftId: 's-late', level: ShiftPreferenceLevel.PREFERRED },
      ],
      weekdayWorkloads: { mon: 30, wed: 30 },
    };
    normalizeContractShiftFields(contract, SHIFTS);
    expect(contract.shiftWeekdays).toEqual(['mon', 'wed']);
    expect(contract.shiftPreferences).toEqual([
      { shiftId: 's-late', level: ShiftPreferenceLevel.AVOID },
    ]);
  });

  it('rejects shift weekdays outside the working days', () => {
    expect(() =>
      normalizeContractShiftFields(
        {
          worksShifts: true,
          shiftWeekdays: ['mon', 'sat'],
          shiftPreferences: [],
          weekdayWorkloads: { mon: 50, tue: 50 },
        },
        SHIFTS,
      ),
    ).toThrow(BadRequestException);
  });

  it('allows any weekday when the contract has no per-day schedule', () => {
    const contract = {
      worksShifts: true,
      shiftWeekdays: ['sat'],
      shiftPreferences: [],
    };
    normalizeContractShiftFields(contract, SHIFTS);
    expect(contract.shiftWeekdays).toEqual(['sat']);
  });

  it('rejects unknown weekdays and shifts of another organisation', () => {
    expect(() =>
      normalizeContractShiftFields(
        { worksShifts: true, shiftWeekdays: ['monday'], shiftPreferences: [] },
        SHIFTS,
      ),
    ).toThrow(BadRequestException);
    expect(() =>
      normalizeContractShiftFields(
        {
          worksShifts: true,
          shiftWeekdays: [],
          shiftPreferences: [
            { shiftId: 'foreign', level: ShiftPreferenceLevel.PREFERRED },
          ],
        },
        SHIFTS,
      ),
    ).toThrow(BadRequestException);
  });
});
