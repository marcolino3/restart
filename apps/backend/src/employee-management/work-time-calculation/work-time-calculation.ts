import { DateTime } from 'luxon';
import {
  CalcAbsenceDay,
  CalcContract,
  CalcInput,
  CalcTimeWindow,
  DayResult,
  WeekdayWorkloadShares,
} from './work-time-calculation.types';

/**
 * Reine Arbeitszeit-Berechnungs-Engine (Port von colibri-calculations).
 *
 * Produziert pro Tag im Range ein {@link DayResult}. Das Ergebnis wird vom
 * Recompute-Service ins materialisierte Ledger (work_day_balances) geschrieben;
 * Auswertungen/Salden lesen dann nur noch aggregiert aus dem Ledger.
 *
 * Bewusst seiteneffektfrei und deterministisch → vollständig unit-testbar.
 */

const WEEKDAY_KEYS: (keyof WeekdayWorkloadShares)[] = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
];

/** Minuten eines "HH:mm"-"HH:mm"-Zeitfensters (0 bei ungültig/rückwärts). */
export function timeWindowMinutes(window: CalcTimeWindow): number {
  const toMinutes = (t: string): number => {
    const [h, m] = t.split(':');
    return (Number(h) || 0) * 60 + (Number(m) || 0);
  };
  return Math.max(0, toMinutes(window.end) - toMinutes(window.start));
}

/** Sollminuten eines Tages aus dem Vertrag. `weekday`: 1=Mo … 7=So (Luxon). */
export function dailyPlannedMinutes(
  contract: CalcContract,
  weekday: number,
): number {
  // 1. Konkrete Zeitfenster haben Vorrang: Summe der Fensterdauern des Tages.
  //    Ein definierter Plan ohne Fenster für diesen Tag = frei (0 Min).
  const windows = contract.weekdayTimeWindows;
  if (windows) {
    const dayWindows = windows[WEEKDAY_KEYS[weekday - 1]];
    if (!dayWindows || dayWindows.length === 0) return 0;
    return dayWindows.reduce((sum, w) => sum + timeWindowMinutes(w), 0);
  }

  const weeklyMinutes = contract.weeklyHours * 60;
  // 2. Ungleiche Prozent-Verteilung pro Wochentag.
  const shares = contract.weekdayWorkloads;
  if (shares) {
    const share = shares[WEEKDAY_KEYS[weekday - 1]];
    if (share == null) return 0;
    return Math.round((share / 100) * weeklyMinutes);
  }
  // 3. Default: gleichmässig Mo–Fr.
  return weekday <= 5 ? Math.round(weeklyMinutes / 5) : 0;
}

/** Aktiver Vertrag an einem Tag (jüngster passender), oder null. */
function activeContractFor(
  contracts: CalcContract[],
  date: string,
): CalcContract | null {
  let chosen: CalcContract | null = null;
  for (const c of contracts) {
    const startsOk = c.startDate <= date;
    const endsOk = c.endDate == null || c.endDate >= date;
    if (startsOk && endsOk) {
      if (!chosen || c.startDate > chosen.startDate) chosen = c;
    }
  }
  return chosen;
}

/** Dominante Absenz eines Tages (höchster Abwesenheitsgrad). */
function dominantAbsence(
  absences: CalcAbsenceDay[],
): CalcAbsenceDay | undefined {
  return absences.reduce<CalcAbsenceDay | undefined>((best, a) => {
    if (!best || a.percentage > best.percentage) return a;
    return best;
  }, undefined);
}

/** Vertrag, soweit für den Ferienanspruch relevant. */
export interface VacationEntitlementContract {
  /** inklusiv */
  startDate: string;
  /** inklusiv; null = offen */
  endDate: string | null;
  annualVacationDays: number;
}

/**
 * Ferienanspruch pro-rata über einen Bereich (typisch: eine Periode): jeder
 * (teil-)überlappende Vertrag trägt annualVacationDays × Überlappungstage /
 * Bereichstage bei (colibri: Vertragstage / Schuljahrestage). Auf halbe Tage
 * gerundet.
 */
export function proRataEntitlementDays(
  contracts: VacationEntitlementContract[],
  rangeStart: string,
  rangeEnd: string,
): number {
  const start = DateTime.fromISO(rangeStart);
  const end = DateTime.fromISO(rangeEnd);
  const totalDays = end.diff(start, 'days').days + 1;
  if (totalDays <= 0) return 0;

  let entitlement = 0;
  for (const c of contracts) {
    const overlapStart = c.startDate > rangeStart ? c.startDate : rangeStart;
    const overlapEnd =
      c.endDate != null && c.endDate < rangeEnd ? c.endDate : rangeEnd;
    if (overlapStart > overlapEnd) continue;
    const overlapDays =
      DateTime.fromISO(overlapEnd).diff(DateTime.fromISO(overlapStart), 'days')
        .days + 1;
    entitlement += (Number(c.annualVacationDays) * overlapDays) / totalDays;
  }
  return Math.round(entitlement * 2) / 2;
}

export function calculateDays(input: CalcInput): DayResult[] {
  const holidayByDate = new Map(input.holidays.map((h) => [h.date, h]));
  const vacationDates = new Set(input.vacationDays.map((v) => v.date));

  const absencesByDate = new Map<string, CalcAbsenceDay[]>();
  for (const a of input.absenceDays) {
    const list = absencesByDate.get(a.date) ?? [];
    list.push(a);
    absencesByDate.set(a.date, list);
  }

  const workedByDate = new Map<string, number>();
  for (const w of input.workEntries) {
    workedByDate.set(w.date, (workedByDate.get(w.date) ?? 0) + w.workMinutes);
  }

  const start = DateTime.fromISO(input.rangeStart);
  const end = DateTime.fromISO(input.rangeEnd);
  const results: DayResult[] = [];

  for (let d = start; d <= end; d = d.plus({ days: 1 })) {
    const date = d.toISODate() as string;
    const weekday = d.weekday; // 1=Mo … 7=So
    const isWeekend = weekday > 5;

    const contract = activeContractFor(input.contracts, date);

    const result: DayResult = {
      date,
      contractId: contract?.id ?? null,
      plannedMinutes: 0,
      workedMinutes: workedByDate.get(date) ?? 0,
      vacationMinutes: 0,
      absenceMinutes: 0,
      actualMinutes: 0,
      differenceMinutes: 0,
      cappedMinutes: 0,
      isWeekend,
      isHoliday: false,
      isVacation: false,
      isAbsence: false,
      isFreeDay: false,
      isNoContract: contract == null,
      overtimeCapped: false,
    };

    if (contract) {
      result.plannedMinutes = dailyPlannedMinutes(contract, weekday);
    }
    result.isFreeDay =
      !isWeekend && contract != null && result.plannedMinutes === 0;

    // Feiertag reduziert die Sollzeit (teilbezahlt möglich) und überschreibt
    // Ferien/Absenz an diesem Tag.
    const holiday = holidayByDate.get(date);
    if (holiday) {
      result.isHoliday = true;
      const unpaidFactor = Math.max(
        0,
        Math.min(1, 1 - holiday.paidPercentage / 100),
      );
      result.plannedMinutes = Math.round(result.plannedMinutes * unpaidFactor);
    } else {
      const isVacationDay =
        vacationDates.has(date) && result.plannedMinutes > 0;
      const absence = dominantAbsence(absencesByDate.get(date) ?? []);

      if (
        isVacationDay &&
        absence &&
        absence.countsAsWorkTime &&
        absence.isVacationCapable === false
      ) {
        // Krank/verunfallt in den Ferien und nicht ferienfähig: der Ferientag
        // wird gutgeschrieben (nicht konsumiert), die Absenz deckt den Tag.
        result.isAbsence = true;
        result.absenceMinutes = Math.round(
          (result.plannedMinutes * absence.percentage) / 100,
        );
      } else if (isVacationDay) {
        // Ferien decken den Tag; eine gleichzeitige Absenz zählt nicht
        // zusätzlich (keine Doppel-Anrechnung).
        result.isVacation = true;
        result.vacationMinutes = result.plannedMinutes;
      } else if (absence) {
        // Absenz: zählt nur als Arbeitszeit, wenn die Kategorie es vorsieht.
        result.isAbsence = true;
        if (absence.countsAsWorkTime) {
          result.absenceMinutes = Math.round(
            (result.plannedMinutes * absence.percentage) / 100,
          );
        }
      }
    }

    result.actualMinutes =
      result.workedMinutes + result.vacationMinutes + result.absenceMinutes;
    result.differenceMinutes = result.actualMinutes - result.plannedMinutes;

    results.push(result);
  }

  applyWeeklyOvertimeCap(results, absencesByDate);
  return results;
}

/**
 * Wochenweiser Überzeit-Cap bei Arbeitszeit-Absenzen (CH-Regel): In Wochen mit
 * einer als Arbeitszeit zählenden Absenz (Krankheit/Unfall) darf keine
 * Netto-Überzeit aufgebaut werden — positiver Wochensaldo wird auf 0 gekappt.
 * Minuszeit bleibt unverändert.
 */
function applyWeeklyOvertimeCap(
  days: DayResult[],
  absencesByDate: Map<string, CalcAbsenceDay[]>,
): void {
  const weeks = new Map<string, DayResult[]>();
  for (const day of days) {
    const dt = DateTime.fromISO(day.date);
    const key = `${dt.weekYear}-${dt.weekNumber}`;
    const list = weeks.get(key) ?? [];
    list.push(day);
    weeks.set(key, list);
  }

  for (const week of weeks.values()) {
    const hasWorkTimeAbsence = week.some((day) =>
      (absencesByDate.get(day.date) ?? []).some((a) => a.countsAsWorkTime),
    );
    if (!hasWorkTimeAbsence) continue;

    let excess = week.reduce((sum, day) => sum + day.differenceMinutes, 0);
    if (excess <= 0) continue;

    // Überzeit von hinten nach vorne abbauen.
    const sorted = [...week].sort((a, b) => (a.date < b.date ? 1 : -1));
    for (const day of sorted) {
      if (excess <= 0) break;
      if (day.differenceMinutes > 0) {
        const reduction = Math.min(day.differenceMinutes, excess);
        day.differenceMinutes -= reduction;
        day.cappedMinutes += reduction;
        day.overtimeCapped = true;
        excess -= reduction;
      }
    }
  }
}
