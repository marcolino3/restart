/**
 * Reine, framework-/DB-unabhängige Eingabe- und Ausgabetypen der
 * Arbeitszeit-Berechnungs-Engine. Bewusst von den TypeORM-Entities entkoppelt,
 * damit die Engine isoliert unit-testbar ist (kein RxJS, kein Firebase — anders
 * als das colibri-calculations-Original).
 *
 * Alle Datums-Felder sind ISO-'YYYY-MM-DD'-Strings; alle Zeiten in Minuten.
 */

/** Pensum-Anteil pro Wochentag in Prozent der Wochenstunden (Summe ≤ 100). */
export interface WeekdayWorkloadShares {
  mon?: number | null;
  tue?: number | null;
  wed?: number | null;
  thu?: number | null;
  fri?: number | null;
  sat?: number | null;
  sun?: number | null;
}

export interface CalcContract {
  id: string;
  /** inklusiv */
  startDate: string;
  /** inklusiv; null = offen */
  endDate: string | null;
  /** Tatsächliche vertragliche Wochenstunden (bereits inkl. Pensum). */
  weeklyHours: number;
  /** Optional ungleiche Verteilung; null = gleichmässig Mo–Fr. */
  weekdayWorkloads?: WeekdayWorkloadShares | null;
}

export interface CalcHoliday {
  date: string;
  /** 0–100; bezahlter Anteil des freien Tages (reduziert die Sollzeit). */
  paidPercentage: number;
}

/** Eine bereits auf einen einzelnen Tag aufgelöste Absenz. */
export interface CalcAbsenceDay {
  date: string;
  /** 1–100; Abwesenheitsgrad an diesem Tag. */
  percentage: number;
  /** Kategorie zählt als Arbeitszeit (Krankheit/Unfall) → keine Sollzeit-Lücke. */
  countsAsWorkTime: boolean;
}

/** Ein bereits auf einen einzelnen Tag aufgelöster Ferientag. */
export interface CalcVacationDay {
  date: string;
}

export interface CalcWorkEntry {
  date: string;
  /** Netto-Arbeitsminuten des Eintrags. */
  workMinutes: number;
}

export interface CalcInput {
  /** inklusiv */
  rangeStart: string;
  /** inklusiv */
  rangeEnd: string;
  contracts: CalcContract[];
  holidays: CalcHoliday[];
  absenceDays: CalcAbsenceDay[];
  vacationDays: CalcVacationDay[];
  workEntries: CalcWorkEntry[];
}

export interface DayResult {
  date: string;
  contractId: string | null;
  plannedMinutes: number;
  workedMinutes: number;
  vacationMinutes: number;
  absenceMinutes: number;
  actualMinutes: number;
  differenceMinutes: number;
  cappedMinutes: number;
  isWeekend: boolean;
  isHoliday: boolean;
  isVacation: boolean;
  isAbsence: boolean;
  isFreeDay: boolean;
  isNoContract: boolean;
  overtimeCapped: boolean;
}
