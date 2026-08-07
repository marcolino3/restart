import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { CompanyVacationHoliday } from '@/employee-management/company-vacations/entities/company-vacation-holiday.entity';

/**
 * Eine einem Mitarbeiter zugewiesene Betriebsferien, zugeschnitten auf eine
 * Abrechnungsperiode (Stichtag bis Vortag des nächsten Stichtags).
 *
 * Betriebsferien werden org-weit als ein Zeitraum gepflegt. Überschreitet ein
 * Zeitraum den Stichtag, gehört ein Teil der Tage in die eine, der Rest in die
 * folgende Periode. Statt die Daten zu splitten, liefert die Abfrage pro
 * berührter Periode ein Segment: `startDate`/`endDate` sind auf die Periode
 * begrenzt, `effectiveDays` und `holidays` zählen nur das Segment.
 *
 * Nicht persistiert — pro Abfrage aus Zuweisung, Stichtag und Feiertagen
 * berechnet. `id` ist zusammengesetzt (`<vacationId>:<periodStart>`), damit
 * mehrere Segmente derselben Betriebsferien im Frontend unterscheidbar sind.
 */
@ObjectType()
export class EmployeeCompanyVacation {
  /** `<companyVacationId>:<periodStart>` — pro Segment eindeutig. */
  @Field(() => ID)
  id!: string;

  /** Id der zugrundeliegenden Betriebsferien (für Mutationen). */
  @Field(() => ID)
  companyVacationId!: string;

  @Field(() => String)
  name!: string;

  /** Beginn des Segments: Beginn der Betriebsferien oder Periodenstart. */
  @Field(() => String)
  startDate!: string;

  /** Ende des Segments: Ende der Betriebsferien oder Periodenende. */
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

  /** True, wenn die Betriebsferien über den Stichtag hinausgeht. */
  @Field(() => Boolean)
  isSplit!: boolean;
}
