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

/** Ein konkretes Arbeitszeitfenster ("HH:mm"–"HH:mm", 24h). */
export interface CalcTimeWindow {
  start: string;
  end: string;
}

/**
 * Konkrete Arbeitszeitfenster pro Wochentag. Wenn gesetzt, ist dies die
 * Sollzeit-Quelle (Summe der Fensterdauern) und hat Vorrang vor
 * {@link WeekdayWorkloadShares}/`weeklyHours`. Ein Tag ohne Fenster = frei.
 */
export interface WeekdayTimeWindows {
  mon?: CalcTimeWindow[] | null;
  tue?: CalcTimeWindow[] | null;
  wed?: CalcTimeWindow[] | null;
  thu?: CalcTimeWindow[] | null;
  fri?: CalcTimeWindow[] | null;
  sat?: CalcTimeWindow[] | null;
  sun?: CalcTimeWindow[] | null;
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
  /**
   * Optional konkrete Zeitfenster pro Wochentag; hat Vorrang vor
   * weekdayWorkloads. null = nicht genutzt.
   */
  weekdayTimeWindows?: WeekdayTimeWindows | null;
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
  /**
   * War die Person trotz Absenz ferienfähig? Bei `false` (z. B. krank in den
   * Ferien) wird ein überlappender Ferientag nicht konsumiert, sondern durch
   * die Absenz gedeckt (Ferien-Gutschrift, vgl. colibri `isFitForVacation`).
   * Fehlend = `true`.
   */
  isVacationCapable?: boolean;
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
