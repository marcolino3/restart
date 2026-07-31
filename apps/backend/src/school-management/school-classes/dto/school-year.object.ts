import { Field, Int, ObjectType } from '@nestjs/graphql';

/**
 * A school year as derived from the organisation's cut-off date.
 *
 * Not an entity — nothing is stored. See `lib/school-year.ts`.
 */
@ObjectType()
export class SchoolYear {
  /** First day, inclusive (e.g. "2026-08-01"). */
  @Field(() => String)
  start: string;

  /** Last day, inclusive (e.g. "2027-07-31"). */
  @Field(() => String)
  end: string;

  /** Calendar year the school year starts in — 2026 for "2026/27". */
  @Field(() => Int)
  startYear: number;

  /** Display label, e.g. "2026/27". */
  @Field(() => String)
  label: string;
}
