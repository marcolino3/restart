import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { CompanyVacationHoliday } from '@/employee-management/company-vacations/entities/company-vacation-holiday.entity';

/**
 * Individuelle Ferien eines Mitarbeiters, zugeschnitten auf eine
 * Abrechnungsperiode (Stichtag bis Vortag des nächsten Stichtags).
 *
 * Analog zu `EmployeeCompanyVacation` — nicht persistiert, pro Abfrage aus
 * `EmployeeVacation`, Stichtag und Feiertagen berechnet. `id` ist
 * zusammengesetzt (`<employeeVacationId>:<periodStart>`).
 */
@ObjectType()
export class EmployeeVacationSegment {
  /** `<employeeVacationId>:<periodStart>` — pro Segment eindeutig. */
  @Field(() => ID)
  id!: string;

  /** Id der zugrundeliegenden individuellen Ferien (für Mutationen). */
  @Field(() => ID)
  employeeVacationId!: string;

  @Field(() => String, { nullable: true })
  name!: string | null;

  /** Beginn des Segments: Beginn der Ferien oder Periodenstart. */
  @Field(() => String)
  startDate!: string;

  /** Ende des Segments: Ende der Ferien oder Periodenende. */
  @Field(() => String)
  endDate!: string;

  /** Werktage im Segment minus Feiertagsanteil. */
  @Field(() => Float)
  effectiveDays!: number;

  /** Feiertage im Segment, inklusive Wochenend-Feiertagen. */
  @Field(() => [CompanyVacationHoliday])
  holidays!: CompanyVacationHoliday[];

  /** Label der Periode, z.B. "2026/27". */
  @Field(() => String)
  periodLabel!: string;

  /** Beginn der Abrechnungsperiode (Stichtag). */
  @Field(() => String)
  periodStartDate!: string;

  /** Ende der Abrechnungsperiode (Vortag des nächsten Stichtags). */
  @Field(() => String)
  periodEndDate!: string;

  /** True, wenn die Ferien über den Stichtag hinausgeht. */
  @Field(() => Boolean)
  isSplit!: boolean;
}
