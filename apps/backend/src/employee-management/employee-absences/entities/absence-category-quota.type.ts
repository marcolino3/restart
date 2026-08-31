import { Field, Int, ObjectType } from '@nestjs/graphql';

/**
 * Remaining self-service allowance of one absence category for the caller,
 * within the org's time-tracking period (anchor day) that contains `date`.
 * `maxDaysPerYear = null` means the category is unlimited.
 */
@ObjectType()
export class AbsenceCategoryQuota {
  @Field(() => String)
  absenceCategoryId: string;

  @Field(() => Int, { nullable: true })
  maxDaysPerYear: number | null;

  // Approved + pending days of this category inside the period.
  @Field(() => Int)
  usedDays: number;

  @Field(() => Int, { nullable: true })
  remainingDays: number | null;

  @Field(() => String)
  periodStart: string;

  @Field(() => String)
  periodEnd: string;
}
