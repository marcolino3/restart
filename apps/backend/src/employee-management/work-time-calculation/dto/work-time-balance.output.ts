import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

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
