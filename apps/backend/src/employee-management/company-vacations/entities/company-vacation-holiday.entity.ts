import { Field, Int, ObjectType } from '@nestjs/graphql';

/**
 * Ein Feiertag, der in den Zeitraum einer Betriebsferien fällt. Nicht
 * persistiert — pro Abfrage aus den Org-Feiertagen aufgelöst.
 *
 * `date` ist das konkrete Datum im Betriebsferien-Zeitraum; bei jährlich
 * wiederkehrenden Feiertagen weicht es vom Ankerdatum der Holiday-Entity ab.
 *
 * Wochenend-Feiertage (`isWeekend`) werden mitgeführt, reduzieren die
 * effektiven Ferientage aber nicht — dort wird ohnehin nicht gearbeitet.
 */
@ObjectType()
export class CompanyVacationHoliday {
  @Field(() => String)
  date!: string;

  @Field(() => String)
  name!: string;

  @Field(() => Int)
  paidPercentage!: number;

  /** Feiertag fällt auf Sa/So — zählt nicht als gesparter Ferientag. */
  @Field(() => Boolean)
  isWeekend!: boolean;
}
