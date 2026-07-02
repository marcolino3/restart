import {
  calculateDays,
  dailyPlannedMinutes,
  proRataEntitlementDays,
} from './work-time-calculation';
import { CalcContract, CalcInput } from './work-time-calculation.types';

const fullTime: CalcContract = {
  id: 'c1',
  startDate: '2026-01-01',
  endDate: null,
  weeklyHours: 42, // → 504 min/Tag Mo–Fr
};

function baseInput(overrides: Partial<CalcInput>): CalcInput {
  return {
    rangeStart: '2026-06-01', // Montag
    rangeEnd: '2026-06-07', // Sonntag
    contracts: [fullTime],
    holidays: [],
    absenceDays: [],
    vacationDays: [],
    workEntries: [],
    ...overrides,
  };
}

describe('dailyPlannedMinutes', () => {
  it('verteilt Vollzeit gleichmässig auf Mo–Fr', () => {
    expect(dailyPlannedMinutes(fullTime, 1)).toBe(504); // Mo
    expect(dailyPlannedMinutes(fullTime, 5)).toBe(504); // Fr
    expect(dailyPlannedMinutes(fullTime, 6)).toBe(0); // Sa
    expect(dailyPlannedMinutes(fullTime, 7)).toBe(0); // So
  });

  it('respektiert ungleiche Wochentags-Pensen', () => {
    const c: CalcContract = {
      ...fullTime,
      weeklyHours: 40,
      weekdayWorkloads: { mon: 25, tue: 25, wed: 25, thu: 25, fri: 0 },
    };
    expect(dailyPlannedMinutes(c, 1)).toBe(600); // 25% von 2400
    expect(dailyPlannedMinutes(c, 5)).toBe(0); // Fr frei
  });
});

describe('proRataEntitlementDays', () => {
  const range = ['2025-08-01', '2026-07-31'] as const; // 365 Tage

  it('gibt den vollen Anspruch bei durchgehendem Vertrag', () => {
    const days = proRataEntitlementDays(
      [{ startDate: '2024-01-01', endDate: null, annualVacationDays: 25 }],
      ...range,
    );
    expect(days).toBe(25);
  });

  it('kürzt pro-rata bei unterjährigem Eintritt', () => {
    // Eintritt 1.2.2026 → 181 von 365 Tagen ≈ 12.4 → 12.5 (halbe Tage)
    const days = proRataEntitlementDays(
      [{ startDate: '2026-02-01', endDate: null, annualVacationDays: 25 }],
      ...range,
    );
    expect(days).toBe(12.5);
  });

  it('summiert mehrere Verträge mit unterschiedlichem Anspruch', () => {
    // 1. Halbjahr (184 Tage) 20 Tage, 2. Halbjahr (181 Tage) 30 Tage
    const days = proRataEntitlementDays(
      [
        {
          startDate: '2025-08-01',
          endDate: '2026-01-31',
          annualVacationDays: 20,
        },
        { startDate: '2026-02-01', endDate: null, annualVacationDays: 30 },
      ],
      ...range,
    );
    // 20×184/365 + 30×181/365 = 10.08 + 14.88 = 24.96 → 25
    expect(days).toBe(25);
  });

  it('ignoriert Verträge ausserhalb des Bereichs', () => {
    const days = proRataEntitlementDays(
      [
        {
          startDate: '2024-01-01',
          endDate: '2025-07-31',
          annualVacationDays: 25,
        },
      ],
      ...range,
    );
    expect(days).toBe(0);
  });
});

describe('calculateDays', () => {
  it('rechnet eine reine Vollzeitwoche ohne Einträge als Minuszeit', () => {
    const days = calculateDays(baseInput({}));
    expect(days).toHaveLength(7);
    const mon = days[0];
    expect(mon.plannedMinutes).toBe(504);
    expect(mon.differenceMinutes).toBe(-504);
    const sat = days[5];
    expect(sat.isWeekend).toBe(true);
    expect(sat.plannedMinutes).toBe(0);
  });

  it('verbucht geleistete Arbeitszeit als Ist und bildet die Differenz', () => {
    const days = calculateDays(
      baseInput({
        workEntries: [{ date: '2026-06-01', workMinutes: 540 }],
      }),
    );
    const mon = days[0];
    expect(mon.workedMinutes).toBe(540);
    expect(mon.actualMinutes).toBe(540);
    expect(mon.differenceMinutes).toBe(36); // 540 - 504
  });

  it('reduziert die Sollzeit an einem voll bezahlten Feiertag auf 0', () => {
    const days = calculateDays(
      baseInput({ holidays: [{ date: '2026-06-01', paidPercentage: 100 }] }),
    );
    const mon = days[0];
    expect(mon.isHoliday).toBe(true);
    expect(mon.plannedMinutes).toBe(0);
    expect(mon.differenceMinutes).toBe(0);
  });

  it('teilbezahlter Feiertag (50%) halbiert die Sollzeit', () => {
    const days = calculateDays(
      baseInput({ holidays: [{ date: '2026-06-01', paidPercentage: 50 }] }),
    );
    expect(days[0].plannedMinutes).toBe(252);
  });

  it('deckt einen Ferientag mit der Tages-Sollzeit', () => {
    const days = calculateDays(
      baseInput({ vacationDays: [{ date: '2026-06-02' }] }),
    );
    const tue = days[1];
    expect(tue.isVacation).toBe(true);
    expect(tue.vacationMinutes).toBe(504);
    expect(tue.differenceMinutes).toBe(0);
  });

  it('rechnet eine Arbeitszeit-Absenz (Krankheit) als Ist an', () => {
    const days = calculateDays(
      baseInput({
        absenceDays: [
          { date: '2026-06-02', percentage: 100, countsAsWorkTime: true },
        ],
      }),
    );
    const tue = days[1];
    expect(tue.isAbsence).toBe(true);
    expect(tue.absenceMinutes).toBe(504);
    expect(tue.differenceMinutes).toBe(0);
  });

  it('erzeugt bei nicht anrechenbarer Absenz eine Soll-Lücke', () => {
    const days = calculateDays(
      baseInput({
        absenceDays: [
          { date: '2026-06-02', percentage: 100, countsAsWorkTime: false },
        ],
      }),
    );
    const tue = days[1];
    expect(tue.isAbsence).toBe(true);
    expect(tue.absenceMinutes).toBe(0);
    expect(tue.differenceMinutes).toBe(-504);
  });

  it('kappt Netto-Überzeit in Wochen mit Krankheits-Absenz', () => {
    const days = calculateDays(
      baseInput({
        // Mo Krankheit (504 angerechnet), Di–Fr je 600 gearbeitet (+96/Tag)
        absenceDays: [
          { date: '2026-06-01', percentage: 100, countsAsWorkTime: true },
        ],
        workEntries: [
          { date: '2026-06-02', workMinutes: 600 },
          { date: '2026-06-03', workMinutes: 600 },
          { date: '2026-06-04', workMinutes: 600 },
          { date: '2026-06-05', workMinutes: 600 },
        ],
      }),
    );
    const weekDiff = days.reduce((s, d) => s + d.differenceMinutes, 0);
    expect(weekDiff).toBe(0); // Überzeit gekappt
    expect(days.some((d) => d.overtimeCapped)).toBe(true);
  });

  it('schreibt Ferientage gut, wenn eine Arbeitszeit-Absenz ohne Ferienfähigkeit überlappt', () => {
    // Krank in den Ferien (isVacationCapable=false): Ferientag wird nicht
    // konsumiert, die Absenz deckt den Tag.
    const days = calculateDays(
      baseInput({
        vacationDays: [{ date: '2026-06-02' }],
        absenceDays: [
          {
            date: '2026-06-02',
            percentage: 100,
            countsAsWorkTime: true,
            isVacationCapable: false,
          },
        ],
      }),
    );
    const tue = days[1];
    expect(tue.isVacation).toBe(false);
    expect(tue.vacationMinutes).toBe(0);
    expect(tue.isAbsence).toBe(true);
    expect(tue.absenceMinutes).toBe(504);
    expect(tue.differenceMinutes).toBe(0);
  });

  it('konsumiert den Ferientag, wenn die überlappende Absenz ferienfähig ist', () => {
    const days = calculateDays(
      baseInput({
        vacationDays: [{ date: '2026-06-02' }],
        absenceDays: [
          {
            date: '2026-06-02',
            percentage: 100,
            countsAsWorkTime: true,
            isVacationCapable: true,
          },
        ],
      }),
    );
    const tue = days[1];
    expect(tue.isVacation).toBe(true);
    expect(tue.vacationMinutes).toBe(504);
    // Keine Doppel-Anrechnung: Absenz zählt nicht zusätzlich.
    expect(tue.absenceMinutes).toBe(0);
    expect(tue.actualMinutes).toBe(504);
  });

  it('markiert Tage ohne Vertrag', () => {
    const days = calculateDays(
      baseInput({
        rangeStart: '2025-12-29',
        rangeEnd: '2025-12-29',
        contracts: [{ ...fullTime, startDate: '2026-01-01' }],
      }),
    );
    expect(days[0].isNoContract).toBe(true);
    expect(days[0].plannedMinutes).toBe(0);
  });
});
