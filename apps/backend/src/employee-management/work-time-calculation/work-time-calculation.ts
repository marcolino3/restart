import { DateTime } from 'luxon';
import {
  CalcAbsenceDay,
  CalcContract,
  CalcHoliday,
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

  // `weeklyHours` ist die Vollzeit-Referenz (Stunden bei 100 % Pensum).
  const weeklyMinutes = contract.weeklyHours * 60;
  // 2. Ungleiche Prozent-Verteilung pro Wochentag. Die Anteile beziehen sich
  //    auf die Vollzeit-Woche und enthalten das Pensum bereits.
  const shares = contract.weekdayWorkloads;
  if (shares) {
    const share = shares[WEEKDAY_KEYS[weekday - 1]];
    if (share == null) return 0;
    return Math.round((share / 100) * weeklyMinutes);
  }
  // 3. Default: Pensum gleichmässig auf Mo–Fr. Ohne Pensum gilt Vollzeit.
  if (weekday > 5) return 0;
  const workloadShare = (contract.workloadPercent ?? 100) / 100;
  return Math.round((weeklyMinutes * workloadShare) / 5);
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

/** Angerechnete Minuten: exakte Dauer bei Von–Bis, sonst Anteil des Solls. */
function creditedAbsenceMinutes(
  plannedMinutes: number,
  absence: CalcAbsenceDay,
): number {
  if (absence.absenceMinutes != null) {
    return Math.min(absence.absenceMinutes, plannedMinutes);
  }
  return Math.round((plannedMinutes * absence.percentage) / 100);
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

/** Absenz, soweit für die Ferienkürzung (OR Art. 329b) relevant. */
export interface VacationReductionAbsence {
  /** Kalendertage der Verhinderung, bereits mit dem Abwesenheitsgrad gewichtet. */
  days: number;
  /** Schonfrist in Tagen (30 = unverschuldet, 60 = Schwangerschaft, 0 = verschuldet). */
  gracePeriodDays: number;
}

const REDUCTION_MONTH_DAYS = 30;

/**
 * Ferienkürzung nach OR Art. 329b: Verhinderungstage werden pro Schonfrist
 * kumuliert; für jeden vollen Monat (30 Tage) über der Schonfrist wird der
 * Jahresanspruch um 1/12 gekürzt. Auf halbe Tage gerundet.
 */
export function vacationReductionDays(
  entitlementDays: number,
  absences: VacationReductionAbsence[],
): number {
  const byGrace = new Map<number, number>();
  for (const a of absences) {
    byGrace.set(
      a.gracePeriodDays,
      (byGrace.get(a.gracePeriodDays) ?? 0) + a.days,
    );
  }
  let months = 0;
  for (const [grace, days] of byGrace) {
    months += Math.floor(Math.max(0, days - grace) / REDUCTION_MONTH_DAYS);
  }
  if (months === 0 || entitlementDays <= 0) return 0;
  return Math.round(((months * entitlementDays) / 12) * 2) / 2;
}

/** Monat-Tag-Teil eines ISO-Datums (`MM-DD`). */
export function monthDay(isoDate: string): string {
  return isoDate.slice(5, 10);
}

/** Feiertag für einen Kalendertag (exakt oder jährlich wiederkehrend). */
export function findHolidayForDate(
  holidays: CalcHoliday[],
  date: string,
): CalcHoliday | undefined {
  const exact = holidays.find((h) => h.date === date);
  if (exact) return exact;

  const targetMonthDay = monthDay(date);
  return holidays.find(
    (h) => h.repeatsYearly && monthDay(h.date) === targetMonthDay,
  );
}

/**
 * Effektive Ferientage im Bereich [from..to]: Werktage (Mo–Fr) minus
 * Feiertagsanteil (anteilig nach `paidPercentage`, exakt oder jährlich
 * wiederkehrend). Für Betriebsferien-Anzeige/Persistenz.
 */
export function calculateEffectiveVacationDays(
  from: string,
  to: string,
  holidays: CalcHoliday[],
): number {
  let total = 0;
  for (const { holiday } of eachVacationWorkday(from, to, holidays)) {
    const paidPercentage = holiday?.paidPercentage ?? 0;
    total += (100 - paidPercentage) / 100;
  }
  return Math.round(total * 10) / 10;
}

/**
 * Alle Kalendertage in [from..to] mit dem jeweils greifenden Feiertag und der
 * Wochenend-Kennung. Basis für Ferientage-Zählung (nur Mo–Fr) und
 * Feiertags-Auflistung (alle Tage), damit beide nie divergieren.
 */
function* eachVacationDay(
  from: string,
  to: string,
  holidays: CalcHoliday[],
): Generator<{
  date: string;
  holiday: CalcHoliday | undefined;
  isWeekend: boolean;
}> {
  let d = DateTime.fromISO(from);
  const end = DateTime.fromISO(to);
  while (d <= end) {
    const date = d.toISODate() as string;
    yield {
      date,
      holiday: findHolidayForDate(holidays, date),
      isWeekend: d.weekday > 5,
    };
    d = d.plus({ days: 1 });
  }
}

/** Werktage (Mo–Fr) in [from..to] mit dem jeweils greifenden Feiertag. */
function* eachVacationWorkday(
  from: string,
  to: string,
  holidays: CalcHoliday[],
): Generator<{ date: string; holiday: CalcHoliday | undefined }> {
  for (const day of eachVacationDay(from, to, holidays)) {
    if (!day.isWeekend) yield { date: day.date, holiday: day.holiday };
  }
}

/**
 * Feiertage im Bereich [from..to] — in Kalenderreihenfolge, ein Eintrag pro
 * betroffenem Tag, inklusive Wochenend-Feiertagen. Diese sind mit
 * `isWeekend: true` markiert und reduzieren die effektiven Ferientage nicht.
 * Jährlich wiederkehrende Feiertage tragen das konkrete Datum im Bereich, nicht
 * ihr Ursprungsjahr.
 */
export function listVacationHolidays<T extends CalcHoliday>(
  from: string,
  to: string,
  holidays: T[],
): { date: string; holiday: T; isWeekend: boolean }[] {
  const hits: { date: string; holiday: T; isWeekend: boolean }[] = [];
  for (const { date, holiday, isWeekend } of eachVacationDay(
    from,
    to,
    holidays,
  )) {
    if (holiday) hits.push({ date, holiday: holiday as T, isWeekend });
  }
  return hits;
}

export function calculateDays(input: CalcInput): DayResult[] {
  const holidays = input.holidays;
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
    const holiday = findHolidayForDate(holidays, date);
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
        result.absenceMinutes = creditedAbsenceMinutes(
          result.plannedMinutes,
          absence,
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
          result.absenceMinutes = creditedAbsenceMinutes(
            result.plannedMinutes,
            absence,
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
