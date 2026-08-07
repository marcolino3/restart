import {
  Field,
  Float,
  ID,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';

/** Aggregierter Arbeitszeit-Saldo eines Mitarbeiters über einen Datumsbereich. */
@ObjectType()
export class WorkTimeBalance {
  @Field(() => ID)
  employeeId: string;

  @Field(() => String)
  fromDate: string;

  @Field(() => String)
  toDate: string;

  @Field(() => Int)
  plannedMinutes: number;

  @Field(() => Int)
  workedMinutes: number;

  @Field(() => Int)
  vacationMinutes: number;

  @Field(() => Int)
  absenceMinutes: number;

  @Field(() => Int)
  actualMinutes: number;

  /** Ist − Soll (nach Überzeit-Cap) über den Bereich. */
  @Field(() => Int)
  differenceMinutes: number;

  /** Eröffnungssaldo (Carry-over) der Periode. */
  @Field(() => Int)
  openingWorkMinutes: number;

  /** Ausbezahlte Überzeit im Bereich (reduziert den Nettosaldo). */
  @Field(() => Int)
  paidOvertimeMinutes: number;

  /** differenceMinutes + openingWorkMinutes − paidOvertimeMinutes. */
  @Field(() => Int)
  netBalanceMinutes: number;

  @Field(() => Int)
  vacationDaysUsed: number;

  @Field(() => Int)
  absenceDaysCount: number;
}

/** Monats-Aggregat für den Verlauf. */
@ObjectType()
export class MonthlyWorkTimeSummary {
  @Field(() => Int)
  year: number;

  @Field(() => Int)
  month: number;

  @Field(() => Int)
  plannedMinutes: number;

  @Field(() => Int)
  actualMinutes: number;

  @Field(() => Int)
  differenceMinutes: number;
}

/** Ferien-Saldo (Tage). */
@ObjectType()
export class VacationBalance {
  @Field(() => Float)
  entitlementDays: number;

  @Field(() => Float)
  openingDays: number;

  @Field(() => Float)
  usedDays: number;

  @Field(() => Float)
  remainingDays: number;
}

/** Absenz-Aufschlüsselung nach Kategorie über einen Bereich (colibri-Parität). */
@ObjectType()
export class AbsenceCategorySummary {
  @Field(() => ID)
  categoryId: string;

  @Field(() => String, { nullable: true })
  name: string | null;

  @Field(() => String, { nullable: true })
  color: string | null;

  /** Absenz-Tage mit 100 % Abwesenheitsgrad. */
  @Field(() => Int)
  fullDays: number;

  /** Absenz-Tage mit Teilabsenz (< 100 %). */
  @Field(() => Int)
  partialDays: number;

  @Field(() => Int)
  totalDays: number;
}

/** Zeile der Team-Übersicht (Auswertung). */
@ObjectType()
export class EmployeeWorkTimeOverviewRow {
  @Field(() => ID)
  employeeId: string;

  @Field(() => String, { nullable: true })
  employeeName: string | null;

  @Field(() => Int)
  netBalanceMinutes: number;

  @Field(() => Int)
  vacationDaysUsed: number;
}

/** Art eines Tages in der Monats-Zeiterfassungsübersicht. */
export enum DailyTimeTrackingKind {
  ENTRY = 'ENTRY',
  ABSENCE = 'ABSENCE',
  VACATION = 'VACATION',
  HOLIDAY = 'HOLIDAY',
  NONE = 'NONE',
}
registerEnumType(DailyTimeTrackingKind, { name: 'DailyTimeTrackingKind' });

/**
 * Ein Zeiteintrag innerhalb eines Tages der Monatsübersicht. Ein Tag mit
 * mehreren Zeiteinträgen (mehrere Stempelungen) liefert mehrere Objekte mit
 * gleichem `date`.
 */
@ObjectType()
export class DailyTimeTrackingEntry {
  @Field(() => ID)
  id: string;

  @Field(() => Date)
  startedAt: Date;

  @Field(() => Date, { nullable: true })
  endedAt: Date | null;

  @Field(() => Int, { nullable: true })
  breakMinutes: number | null;

  @Field(() => Int, { nullable: true })
  workMinutes: number | null;

  @Field(() => String, { nullable: true })
  notes: string | null;
}

/** Ein Tag der Monatsübersicht: entweder Zeiteinträge oder Absenz/Ferien/Feiertag. */
@ObjectType()
export class DailyTimeTracking {
  @Field(() => String)
  date: string;

  @Field(() => DailyTimeTrackingKind)
  kind: DailyTimeTrackingKind;

  @Field(() => [DailyTimeTrackingEntry], { nullable: true })
  entries: DailyTimeTrackingEntry[] | null;

  /** Anzeige-Label für ABSENCE/VACATION/HOLIDAY (Kategoriename, Ferien-/Feiertagsname). */
  @Field(() => String, { nullable: true })
  label: string | null;

  /** Kategorie-Farbe (nur ABSENCE). */
  @Field(() => String, { nullable: true })
  color: string | null;

  @Field(() => Int)
  workMinutes: number;
}

/** Ein Monat der Zeiterfassungs-Monatsübersicht, Tage aufsteigend sortiert. */
@ObjectType()
export class MonthlyTimeTrackingGroup {
  @Field(() => Int)
  year: number;

  @Field(() => Int)
  month: number;

  @Field(() => Int)
  workedMinutes: number;

  @Field(() => [DailyTimeTracking])
  days: DailyTimeTracking[];
}
