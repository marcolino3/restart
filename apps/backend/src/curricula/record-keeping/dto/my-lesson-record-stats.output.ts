import { Field, Int, ObjectType } from '@nestjs/graphql';

/** Stat-card summary of the caller's own recording activity. */
@ObjectType()
export class MyLessonRecordStatsOutput {
  @Field(() => Int)
  todayCount: number;

  @Field(() => Int)
  weekCount: number;

  /** weekCount minus the count of the preceding 7-day window. */
  @Field(() => Int)
  weekDelta: number;

  /** Distinct children recorded in the last 7 days. */
  @Field(() => Int)
  studentsReached: number;

  /** Distinct lessons recorded in the last 7 days. */
  @Field(() => Int)
  lessonsCount: number;

  @Field(() => String, { nullable: true })
  lastRecordedAt: string | null;
}
